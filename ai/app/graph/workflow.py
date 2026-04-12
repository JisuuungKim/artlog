"""
LangGraph 워크플로우 정의.

현재 파이프라인:
  stt → correction → feedback_analysis → lesson_note → review_lesson_note
  → embed_note → growth_report

review_lesson_note 가 섹션 중복이 크다고 판단하면
lesson_note 노드로 한 번 더 되돌려 재생성합니다.

체크포인터:
  - psycopg3 AsyncConnectionPool 을 사용한 비동기 연결 풀
  - PostgresSaver 를 통해 `ai_agent_schema` 스키마에 체크포인트 테이블 자동 생성
  - search_path 를 `ai_agent_schema,public` 으로 설정하여 스키마를 분리
"""

import logging

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from psycopg_pool import AsyncConnectionPool

from app.core.config import get_settings
from app.graph.state import AgentState
from app.graph.nodes.stt_agent import stt_node
from app.graph.nodes.correction_agent import correction_node
from app.graph.nodes.lesson_note_agent import (
    feedback_analysis_node,
    generate_lesson_note_node,
    review_lesson_note_node,
    route_after_review,
)
from app.graph.nodes.growth_report_agent import (
    aembed_note_node,
    agenerate_growth_report_node,
)

logger = logging.getLogger(__name__)
settings = get_settings()


# ────────────────────────────────────────────────────────────────
# 그래프 빌더
# ────────────────────────────────────────────────────────────────

def _build_graph() -> StateGraph:
    """엣지와 노드가 연결된 컴파일 전 StateGraph 를 반환합니다."""
    builder = StateGraph(AgentState)

    builder.add_node("stt", stt_node)               # 1. STT
    builder.add_node("correction", correction_node) # 2. 텍스트 보정
    builder.add_node("feedback_analysis", feedback_analysis_node) # 3. 피드백 심층 분석
    builder.add_node("lesson_note", generate_lesson_note_node) # 4. 레슨노트 생성
    builder.add_node("review_lesson_note", review_lesson_note_node) # 5. 중복 검토
    builder.add_node("embed_note", aembed_note_node)              # 6. 임베딩 저장
    builder.add_node("growth_report", agenerate_growth_report_node) # 7. 성장 리포트

    builder.set_entry_point("stt")
    builder.add_edge("stt", "correction")
    builder.add_edge("correction", "feedback_analysis")
    builder.add_edge("feedback_analysis", "lesson_note")
    builder.add_edge("lesson_note", "review_lesson_note")
    builder.add_conditional_edges(
        "review_lesson_note",
        route_after_review,
        {
            "regenerate": "lesson_note",
            "end": "embed_note",
        },
    )
    builder.add_edge("embed_note", "growth_report")
    builder.add_edge("growth_report", END)

    return builder


def build_graph() -> StateGraph:
    """외부에서 그래프 구조(컴파일 전)를 접근할 수 있도록 공개합니다."""
    return _build_graph()


# ────────────────────────────────────────────────────────────────
# 커넥션 풀 & 체크포인터 초기화 / 종료 헬퍼
# ────────────────────────────────────────────────────────────────

async def create_pool() -> AsyncConnectionPool:
    """
    psycopg3 비동기 커넥션 풀을 생성합니다.

    `options` 파라미터로 search_path 를 설정하여
    `ai_agent_schema` 스키마의 테이블이 우선 검색되도록 합니다.
    """
    pool = AsyncConnectionPool(
        conninfo=settings.async_db_url,
        min_size=settings.db_pool_min_size,
        max_size=settings.db_pool_max_size,
        kwargs={
            # psycopg3 연결 옵션: search_path 를 ai_agent_schema,public 으로 설정
            "options": f"-c search_path={settings.ai_schema},public"
        },
        open=False,  # open=False → 명시적으로 await pool.open() 해야 열립니다
    )
    await pool.open()
    logger.info("AsyncConnectionPool opened (schema=%s)", settings.ai_schema)
    return pool


async def create_checkpointer(pool: AsyncConnectionPool) -> AsyncPostgresSaver:
    """
    PostgresSaver 를 초기화하고 체크포인트 테이블을 자동 생성합니다.

    `setup()` 내부에서 `CREATE INDEX CONCURRENTLY` 를 실행하므로
    autocommit=True 인 단독 연결이 필요합니다.

    - setup()  : from_conn_string() 이 내부적으로 autocommit=True AsyncConnection 을 사용
    - 런타임   : Pool 기반 AsyncPostgresSaver 를 반환하여 효율적인 연결 재사용
    """
    import psycopg

    # 1. autocommit 단독 연결로 스키마 생성
    dsn = settings.async_db_url
    async with await psycopg.AsyncConnection.connect(
        dsn,
        autocommit=True,
    ) as conn:
        await conn.execute(
            f"CREATE SCHEMA IF NOT EXISTS {settings.ai_schema}"
        )

    # 2. from_conn_string 은 autocommit=True AsyncConnection 을 직접 생성하므로
    #    CREATE INDEX CONCURRENTLY 허용됨 → setup() 안전 실행
    async with AsyncPostgresSaver.from_conn_string(dsn) as tmp_saver:
        await tmp_saver.setup()

    # 3. 런타임 saver는 커넥션 풀 기반으로 생성 (효율적인 연결 재사용)
    checkpointer = AsyncPostgresSaver(pool)

    logger.info("AsyncPostgresSaver setup complete (schema=%s)", settings.ai_schema)
    return checkpointer


# ────────────────────────────────────────────────────────────────
# 컴파일된 워크플로우 팩토리
# ────────────────────────────────────────────────────────────────

def compile_workflow(checkpointer: AsyncPostgresSaver):
    """
    체크포인터가 주입된 컴파일된 LangGraph 워크플로우를 반환합니다.
    `app.state.workflow` 에 저장하여 라우터에서 공유합니다.
    """
    builder = _build_graph()
    return builder.compile(checkpointer=checkpointer)
