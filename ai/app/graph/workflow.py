"""
LangGraph 워크플로우 정의.

파이프라인:
  stt → correction → feedback_analysis → lesson_note → review_lesson_note
  → extract_improvement → embed_note → growth_report

review_lesson_note 가 섹션 중복이 크다고 판단하면
lesson_note 노드로 한 번 더 되돌려 재생성합니다.

DB 커넥션 풀은 pgvector 기반 EmbeddingStore(임베딩 저장/검색) 전용입니다.
LangGraph 체크포인터는 사용하지 않으므로(매 호출마다 fresh state로 ainvoke)
워크플로우는 stateless 하게 컴파일됩니다.
"""

import logging

from langgraph.graph import StateGraph, END
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
    aextract_improvement_node,
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
    builder.add_node("review_lesson_note", review_lesson_note_node)    # 5. 중복 검토
    builder.add_node("extract_improvement", aextract_improvement_node) # 6. 선생님 칭찬 추출
    builder.add_node("embed_note", aembed_note_node)                   # 7. 임베딩 저장
    builder.add_node("growth_report", agenerate_growth_report_node)    # 8. 성장 리포트

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
            "end": "extract_improvement",
        },
    )
    builder.add_edge("extract_improvement", "embed_note")
    builder.add_edge("embed_note", "growth_report")
    builder.add_edge("growth_report", END)

    return builder


def build_graph() -> StateGraph:
    """외부에서 그래프 구조(컴파일 전)를 접근할 수 있도록 공개합니다."""
    return _build_graph()


# ────────────────────────────────────────────────────────────────
# 커넥션 풀 (EmbeddingStore 용)
# ────────────────────────────────────────────────────────────────

async def create_pool() -> AsyncConnectionPool:
    """psycopg3 비동기 커넥션 풀 생성. EmbeddingStore가 lesson_note_embedding 테이블에 사용."""
    pool = AsyncConnectionPool(
        conninfo=settings.async_db_url,
        min_size=settings.db_pool_min_size,
        max_size=settings.db_pool_max_size,
        open=False,
    )
    await pool.open()
    logger.info("AsyncConnectionPool opened.")
    return pool


# ────────────────────────────────────────────────────────────────
# 컴파일된 워크플로우 팩토리
# ────────────────────────────────────────────────────────────────

def compile_workflow():
    """체크포인터 없이 컴파일된 stateless LangGraph 워크플로우를 반환합니다."""
    builder = _build_graph()
    return builder.compile()
