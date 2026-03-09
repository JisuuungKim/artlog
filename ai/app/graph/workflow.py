"""
LangGraph 워크플로우 정의.

3단계 파이프라인:
  analyze_node → summarize_node → write_lesson_note_node

각 노드는 현재 placeholder 구현으로 작성되어 있습니다.
실제 LLM 호출 로직을 추가할 준비가 된 구조입니다.

체크포인터:
  - psycopg3 AsyncConnectionPool 을 사용한 비동기 연결 풀
  - PostgresSaver 를 통해 `ai_agent_schema` 스키마에 체크포인트 테이블 자동 생성
  - search_path 를 `ai_agent_schema,public` 으로 설정하여 스키마를 분리
"""

import logging
from typing import Any

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from psycopg_pool import AsyncConnectionPool

from app.core.config import get_settings
from app.graph.state import AgentState

logger = logging.getLogger(__name__)
settings = get_settings()


# ────────────────────────────────────────────────────────────────
# 노드 정의 (Placeholder)
# ────────────────────────────────────────────────────────────────

async def analyze_node(state: AgentState) -> dict[str, Any]:
    """
    1단계: 원본 레슨 텍스트를 분석합니다.

    TODO: 실제 LLM 호출로 대체하세요.
    예시)
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(model="gpt-4o-mini")
        result = await llm.ainvoke([HumanMessage(content=state["raw_content"])])
        return {"analysis_result": result.content}
    """
    logger.info("[analyze_node] user_id=%s", state.get("user_id"))

    # --- Placeholder 구현 ---
    analysis_result = f"[분석 완료] 원본 텍스트 길이: {len(state['raw_content'])}자"
    return {"analysis_result": analysis_result}


async def summarize_node(state: AgentState) -> dict[str, Any]:
    """
    2단계: 분석 결과를 요약합니다.

    TODO: 실제 LLM 호출로 대체하세요.
    """
    logger.info("[summarize_node] user_id=%s", state.get("user_id"))

    # --- Placeholder 구현 ---
    summary_result = f"[요약 완료] {state['analysis_result'][:50]}..."
    return {"summary_result": summary_result}


async def write_lesson_note_node(state: AgentState) -> dict[str, Any]:
    """
    3단계: 최종 레슨노트 JSON 을 작성합니다.

    TODO: 실제 LLM 호출로 대체하세요.
    반환값의 `lesson_note` 키가 API 응답의 `lesson_note` 필드가 됩니다.
    """
    logger.info("[write_lesson_note_node] user_id=%s", state.get("user_id"))

    # --- Placeholder 구현 ---
    lesson_note: dict[str, Any] = {
        "title": "레슨 노트 (생성됨)",
        "user_id": state["user_id"],
        "session_id": state["session_id"],
        "key_points": ["핵심 포인트 1", "핵심 포인트 2"],
        "summary": state["summary_result"],
        "action_items": ["다음 레슨 전까지 복습"],
        "raw_content_preview": state["raw_content"][:100],
    }
    return {"lesson_note": lesson_note}


# ────────────────────────────────────────────────────────────────
# 그래프 빌더
# ────────────────────────────────────────────────────────────────

def _build_graph() -> StateGraph:
    """엣지와 노드가 연결된 컴파일 전 StateGraph 를 반환합니다."""
    builder = StateGraph(AgentState)

    builder.add_node("analyze", analyze_node)
    builder.add_node("summarize", summarize_node)
    builder.add_node("write_lesson_note", write_lesson_note_node)

    builder.set_entry_point("analyze")
    builder.add_edge("analyze", "summarize")
    builder.add_edge("summarize", "write_lesson_note")
    builder.add_edge("write_lesson_note", END)

    return builder


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
