"""
growth_report_agent.py — 임베딩 저장 + 성장 리포트 생성

[구조]
1. embed_note_node     : 완성된 레슨노트를 pgvector에 임베딩 저장 (항상 실행)
2. generate_growth_report_node : 과거 피드백과 비교해 5줄 성장 리포트 생성
                                 (누적 레슨노트 3개 미만이면 스킵)
"""

import asyncio
import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.graph.state import AgentState
from app.core.config import get_settings

logger = logging.getLogger(__name__)

_llm = None

GROWTH_REPORT_MIN_NOTES = 3


def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        settings = get_settings()
        _llm = ChatOpenAI(
            model="gpt-5.4-mini",
            temperature=0.3,
            api_key=settings.openai_api_key or None,
        )
    return _llm


GROWTH_REPORT_SYSTEM_PROMPT = """\
너는 보컬 학생의 성장을 분석하는 코치야.

[임무]
아래에 주어진 두 가지 정보를 바탕으로 학생의 성장 리포트를 작성해:
1. 오늘 레슨노트의 핵심 피드백 (현재 상태)
2. 과거 레슨들에서 유사하게 반복된 피드백 (이전 패턴)

[작성 규칙]
- 총 4~5줄로 간결하게 작성
- 반드시 포함할 내용:
  a) 이전에 지적받았으나 이번 레슨에서 개선된 점 (성장한 부분) — 있으면 1~2줄
  b) 여러 레슨에 걸쳐 반복적으로 지적된 문제점 — 1~2줄
  c) 앞으로 집중해야 할 핵심 과제 — 1줄
- 개선된 점이 명확하지 않으면 솔직하게 "아직 패턴을 분석하기 이른 단계"라고 표현해도 됨
- 구체적인 표현 사용 (예: "호흡 조절" → "고음 구간에서 숨을 너무 일찍 소모하는 경향")
- 말투: 따뜻하고 격려하는 톤, 문장 끝은 '~네요', '~보여요', '~해보세요' 형태

[출력]
문단 구분 없이 4~5줄 텍스트만 출력. JSON이나 마크다운 사용 금지.
"""


def embed_note_node(state: AgentState) -> dict[str, Any]:
    """레슨노트를 pgvector에 임베딩 저장합니다. (동기 래퍼 → 비동기 실행)"""
    from app.services.embedding_store import _store  # 앱 시작 시 main.py에서 주입
    if _store is None:
        logger.warning("embed_note_node: EmbeddingStore가 초기화되지 않아 스킵합니다.")
        return {}

    lesson_note = state.get("lesson_note")
    if not lesson_note:
        return {}

    user_id = state.get("user_id")
    note_id = state.get("note_id")

    note_dict = (
        lesson_note.model_dump()
        if hasattr(lesson_note, "model_dump")
        else lesson_note
    )

    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(_store.embed_and_store(user_id, note_id, note_dict))
    except RuntimeError:
        # 이미 이벤트 루프가 실행 중인 환경 (LangGraph async 컨텍스트)
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            future = pool.submit(
                asyncio.run,
                _store.embed_and_store(user_id, note_id, note_dict)
            )
            future.result()

    logger.info("embed_note_node 완료: user_id=%s, note_id=%s", user_id, note_id)
    return {}


async def aembed_note_node(state: AgentState) -> dict[str, Any]:
    """레슨노트를 pgvector에 임베딩 저장합니다. (비동기)"""
    from app.services.embedding_store import _store
    if _store is None:
        logger.warning("embed_note_node: EmbeddingStore가 초기화되지 않아 스킵합니다.")
        return {}

    lesson_note = state.get("lesson_note")
    if not lesson_note:
        return {}

    user_id = state.get("user_id")
    note_id = state.get("note_id")

    note_dict = (
        lesson_note.model_dump()
        if hasattr(lesson_note, "model_dump")
        else lesson_note
    )

    try:
        await _store.embed_and_store(user_id, note_id, note_dict)
        logger.info("embed_note_node 완료: user_id=%s, note_id=%s", user_id, note_id)
    except Exception as e:
        logger.error("embed_note_node 실패 (무시하고 계속): %s", e)

    return {}


async def agenerate_growth_report_node(state: AgentState) -> dict[str, Any]:
    """과거 피드백과 비교해 성장 리포트를 생성합니다. (비동기)"""
    from app.services.embedding_store import _store
    if _store is None:
        logger.warning("generate_growth_report_node: EmbeddingStore가 초기화되지 않아 스킵합니다.")
        return {"growth_report": None}

    user_id = state.get("user_id")
    note_id = state.get("note_id")
    lesson_note = state.get("lesson_note")

    if not lesson_note:
        return {"growth_report": None}

    try:
        note_count = await _store.count_distinct_notes(user_id)
    except Exception as e:
        logger.error("노트 수 조회 실패: %s", e)
        return {"growth_report": None}

    # 현재 노트 포함 count가 MIN_NOTES 미만이면 스킵
    # embed_note_node에서 이미 저장했으므로 count는 현재 노트 포함 값
    if note_count < GROWTH_REPORT_MIN_NOTES:
        logger.info(
            "성장 리포트 스킵: 누적 레슨노트 %d개 (최소 %d개 필요)",
            note_count, GROWTH_REPORT_MIN_NOTES,
        )
        return {"growth_report": None}

    note_dict = (
        lesson_note.model_dump()
        if hasattr(lesson_note, "model_dump")
        else lesson_note
    )

    # 현재 레슨노트의 핵심 피드백 텍스트 수집
    current_texts = []
    for item in note_dict.get("key_feedback", []):
        current_texts.append(f"{item.get('title', '')}: {item.get('content', '')}")
    for item in note_dict.get("practice_guide", []):
        current_texts.append(f"{item.get('title', '')}: {item.get('content', '')}")

    if not current_texts:
        return {"growth_report": None}

    try:
        similar_past = await _store.search_similar(
            user_id=user_id,
            exclude_note_id=note_id,
            query_texts=current_texts[:5],  # 상위 5개 텍스트로 검색
            limit=15,
        )
    except Exception as e:
        logger.error("유사 피드백 검색 실패: %s", e)
        return {"growth_report": None}

    if not similar_past:
        logger.info("유사 과거 피드백 없음. 성장 리포트 스킵.")
        return {"growth_report": None}

    current_summary = "\n".join(f"- {t}" for t in current_texts)
    past_summary = "\n".join(
        f"- [{r['content_type']}] {r['content']} (유사도: {r['similarity']:.2f})"
        for r in similar_past
    )

    try:
        llm = _get_llm()
        result = await llm.ainvoke([
            SystemMessage(content=GROWTH_REPORT_SYSTEM_PROMPT),
            HumanMessage(content=(
                f"[오늘 레슨의 핵심 피드백]\n{current_summary}\n\n"
                f"[과거 레슨에서 유사하게 지적된 피드백]\n{past_summary}"
            )),
        ])
        growth_report = result.content.strip()
        logger.info("성장 리포트 생성 완료: user_id=%s, note_id=%s", user_id, note_id)
        return {"growth_report": growth_report}
    except Exception as e:
        logger.error("성장 리포트 LLM 호출 실패: %s", e)
        return {"growth_report": None}
