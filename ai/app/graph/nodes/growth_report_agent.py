"""
growth_report_agent.py — 개선 발화 추출 + 임베딩 저장 + 성장 리포트 생성

[구조]
1. aextract_improvement_node  : transcript에서 선생님이 명시적으로 인정한 개선/칭찬 발화를 추출
2. aembed_note_node           : 레슨노트 + improvement_noted를 pgvector에 임베딩 저장 (항상 실행)
3. agenerate_growth_report_node :
     - 벡터 검색 ①: 현재 피드백 → 유사 과거 피드백 (created_at 포함, 토픽별 시계열 구성)
     - 최근 컨텍스트: 직전 레슨 흐름을 함께 전달해 가까운 변화 맥락 보강
     - 벡터 검색 ②: 현재 피드백 → 과거 improvement_noted (선생님 명시 칭찬 이력)
     - LLM이 최근 흐름 + 시계열 흐름 + 명시 칭찬 신호를 종합해 성장 리포트 작성
     - 누적 레슨노트 3개 미만이면 스킵

[설계 원칙]
- 벡터 검색은 "비교할 올바른 과거 피드백을 가져오는 것"이 역할
- "성장인지 판단"은 LLM이 시계열 방향과 명시 칭찬 신호를 보고 결정
- 확신할 수 없으면 성장으로 표현하지 않도록 프롬프트로 제어
"""

import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

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


# =====================================================================
# 1. aextract_improvement_node — 선생님 명시 개선 발화 추출
# =====================================================================

EXTRACT_IMPROVEMENT_SYSTEM_PROMPT = """\
너는 보컬 레슨 트랜스크립트에서 선생님이 학생의 개선을 명시적으로 인정한 발화만 추출하는 분석가야.

[추출 대상]
선생님이 직접 말한, 아래 유형의 발화만 추출해:
- 이전보다 나아졌음을 인정하는 표현: ex) "지난번보다 많이 좋아졌어요", "이번엔 됐네요", "그게 이제 잡혔어요"
- 특정 부분이 잘 됐다는 칭찬: ex) "이 부분 호흡이 잘 들어갔어요", "발음이 이번엔 깔끔하게 나왔어요"
- 과거 지적 사항의 해소 언급: ex) "전에 얘기했던 그거 됐어요", "계속 얘기하던 그 부분 해결됐네요"

[추출 제외]
- 지적/교정 피드백
- 학생 발화

[출력 규칙]
- 해당 발화를 원문 그대로 리스트로 반환
- 없으면 빈 리스트 반환
- 발화를 요약하거나 일반화하지 말 것
"""


class _ImprovementExtractionOutput(BaseModel):
    improvements: list[str]


async def aextract_improvement_node(state: AgentState) -> dict[str, Any]:
    """transcript에서 선생님이 명시적으로 인정한 개선/칭찬 발화를 추출합니다."""
    transcripts = state.get("transcripts", [])
    if not transcripts:
        return {"improvements_noted": []}

    full_transcript = "\n".join(transcripts)
    structured_llm = _get_llm().with_structured_output(_ImprovementExtractionOutput)

    try:
        result = structured_llm.invoke([
            SystemMessage(content=EXTRACT_IMPROVEMENT_SYSTEM_PROMPT),
            HumanMessage(content=f"[레슨 트랜스크립트]\n{full_transcript}"),
        ])
        improvements = result.improvements or []
        logger.info(
            "extract_improvement 완료: %d개 추출 (note_id=%s)",
            len(improvements), state.get("note_id"),
        )
        return {"improvements_noted": improvements}
    except Exception as e:
        logger.error("extract_improvement 실패 (무시하고 계속): %s", e)
        return {"improvements_noted": []}


# =====================================================================
# 2. aembed_note_node — 임베딩 저장
# =====================================================================

async def aembed_note_node(state: AgentState) -> dict[str, Any]:
    """레슨노트 + improvement_noted를 pgvector에 임베딩 저장합니다."""
    from app.services.embedding_store import _store
    if _store is None:
        logger.warning("embed_note_node: EmbeddingStore가 초기화되지 않아 스킵합니다.")
        return {}

    lesson_note = state.get("lesson_note")
    if not lesson_note:
        return {}

    user_id = state.get("user_id")
    note_id = state.get("note_id")
    category_id = state.get("category_id")
    folder_id = state.get("folder_id")
    improvements_noted = state.get("improvements_noted") or []

    note_dict = (
        lesson_note.model_dump()
        if hasattr(lesson_note, "model_dump")
        else lesson_note
    )

    try:
        await _store.embed_and_store(
            user_id=user_id,
            note_id=note_id,
            category_id=category_id,
            folder_id=folder_id,
            lesson_note=note_dict,
            improvements_noted=improvements_noted,
        )
        logger.info("embed_note_node 완료: user_id=%s, note_id=%s", user_id, note_id)
    except Exception as e:
        logger.error("embed_note_node 실패 (무시하고 계속): %s", e)

    return {}


# =====================================================================
# 3. agenerate_growth_report_node — 시계열 + 명시 칭찬 기반 성장 리포트
# =====================================================================

GROWTH_REPORT_SYSTEM_PROMPT = """\
너는 보컬 학생의 성장을 분석하는 코치야.

[주어지는 정보]
1. 오늘 레슨의 핵심 피드백 (현재 상태)
2. 최근 과거 레슨 요약: 직전 레슨들에서 어떤 피드백을 받았는지 정리된 것
3. 토픽별 시계열: 같은 주제에 대해 과거 레슨에서 어떤 피드백을 받았는지, 날짜 순서로 정리된 것
4. 선생님이 이번 또는 과거 레슨에서 명시적으로 인정한 개선 발화 (있는 경우)

[성장 판단 기준 — 엄격하게 적용]
- 성장으로 표현할 수 있는 경우:
  - 선생님이 명시적으로 "나아졌다", "됐다", "잡혔다"고 말한 경우 → 가장 강한 신호
- 성장으로 표현하면 안 되는 경우:
  - 과거에 지적받았는데 이번엔 언급이 없는 것 → 성장이 아님, 단순히 이번 레슨에서 안 다룬 것일 수 있음
  - 시계열 데이터가 부족하거나 방향이 불분명한 경우

[반복 지적 판단 기준]
- 유사한 과거 피드백을 찾았다면 먼저 현재 피드백과 무엇이 달라졌는지 비교해:
  - 문제의 위치가 달라졌는지 (예: 전체 호흡 → 고음 직전 호흡)
  - 문제의 강도가 줄었는지/커졌는지
  - 선생님이 요구하는 과제가 더 구체화됐는지
  - 같은 문제가 표현만 다르게 반복되는지
- 차이가 거의 없고 여러 레슨에서 비슷하게 등장할 때만 반복 지적으로 표현해도 됨
- 반복이라고 쓸 때도 "무엇이 그대로이고, 무엇이 달라졌는지"를 함께 설명해

[최근 레슨 활용 기준]
- 최근 과거 레슨 요약은 수업 흐름을 이해하기 위한 참고 자료로 사용해
- 토픽별 시계열이 더 직접적인 근거이므로, 최근 레슨과 유사 검색 결과가 충돌하면 유사 검색 결과를 우선해
- 최근 레슨에만 있고 오늘 피드백에는 없는 내용은 성장으로 해석하지 말 것

[작성 규칙]
- 총 4~5줄, 간결하게
- 성장 신호가 있으면 먼저 서술, 없으면 생략 (억지로 성장을 찾지 말 것)
- 과거와 현재의 차이를 최소 1줄 포함
- 반복 지적 사항은 차이까지 포함해 구체적으로 표현 (예: "호흡 조절" ❌ → "호흡 문제는 이어지지만, 지금은 고음 직전 숨을 너무 일찍 소모하는 쪽으로 더 좁혀졌어요" ✅)
- 마지막 줄: 앞으로 집중할 핵심 과제 1개
- 말투: 따뜻하고 격려하는 톤, 문장 끝은 '~네요', '~보여요', '~해보세요'

[출력]
문단 구분 없이 4~5줄 텍스트만 출력. JSON이나 마크다운 사용 금지.
"""


def _build_timeline_text(timeline_results: list[dict]) -> str:
    """
    시계열 검색 결과를 토픽별로 그룹화해 텍스트로 변환합니다.
    note_id 기준으로 그룹화하고 created_at 순으로 정렬합니다.
    """
    if not timeline_results:
        return "(과거 유사 피드백 없음)"

    # note_id별로 그룹화
    by_note: dict[int, dict] = {}
    for r in timeline_results:
        nid = r["note_id"]
        if nid not in by_note:
            by_note[nid] = {"created_at": r["created_at"], "contents": []}
        by_note[nid]["contents"].append(f"  · {r['content']} (유사도: {r['similarity']:.2f})")

    # created_at 기준 오름차순 (과거→최근)
    sorted_notes = sorted(by_note.items(), key=lambda x: x[1]["created_at"])

    lines = []
    for i, (nid, data) in enumerate(sorted_notes, 1):
        date_str = data["created_at"].strftime("%Y-%m-%d") if data["created_at"] else "날짜 미상"
        lines.append(f"[{i}번째 과거 레슨 — {date_str}]")
        lines.extend(data["contents"])

    return "\n".join(lines)


def _build_improvement_text(improvement_results: list[dict]) -> str:
    if not improvement_results:
        return "(선생님 명시 칭찬 없음)"

    lines = []
    for r in improvement_results:
        date_str = r["created_at"].strftime("%Y-%m-%d") if r["created_at"] else "날짜 미상"
        lines.append(f"- \"{r['content']}\" ({date_str})")
    return "\n".join(lines)


def _build_recent_context_text(recent_notes: list[dict]) -> str:
    if not recent_notes:
        return "(최근 과거 레슨 없음)"

    lines = []
    for i, note in enumerate(recent_notes, 1):
        date_str = note["created_at"].strftime("%Y-%m-%d") if note["created_at"] else "날짜 미상"
        lines.append(f"[최근 레슨 흐름 {i} — {date_str}]")
        for item in note["contents"]:
            lines.append(f"  · {item['content']}")
    return "\n".join(lines)


async def agenerate_growth_report_node(state: AgentState) -> dict[str, Any]:
    """시계열 + 선생님 명시 칭찬 기반으로 성장 리포트를 생성합니다."""
    from app.services.embedding_store import _store
    if _store is None:
        logger.warning("generate_growth_report_node: EmbeddingStore가 초기화되지 않아 스킵합니다.")
        return {"growth_report": None}

    user_id = state.get("user_id")
    note_id = state.get("note_id")
    category_id = state.get("category_id")
    folder_id = state.get("folder_id")
    lesson_note = state.get("lesson_note")

    if not lesson_note:
        return {"growth_report": None}

    try:
        note_count = await _store.count_distinct_notes(
            user_id=user_id,
            category_id=category_id,
            folder_id=folder_id,
        )
    except Exception as e:
        logger.error("노트 수 조회 실패: %s", e)
        return {"growth_report": None}

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

    # 현재 핵심 피드백 텍스트 수집 (검색 쿼리 겸 현재 상태 컨텍스트)
    current_texts = []
    for item in note_dict.get("key_feedback", []):
        current_texts.append(f"{item.get('title', '')}: {item.get('content', '')}")

    if not current_texts:
        return {"growth_report": None}

    try:
        # 검색 ①: 시계열 구성용 — 유사 과거 피드백 (note_id + created_at 포함)
        timeline_results = await _store.search_similar_with_timeline(
            user_id=user_id,
            exclude_note_id=note_id,
            category_id=category_id,
            folder_id=folder_id,
            query_texts=current_texts[:5],
            limit=20,
        )

        # 검색 보강: 새 메타데이터 없이 기존 임베딩 row에서 최근 레슨 흐름만 가져옵니다.
        recent_notes = await _store.search_recent_note_context(
            user_id=user_id,
            exclude_note_id=note_id,
            category_id=category_id,
            folder_id=folder_id,
            note_limit=2,
            content_limit_per_note=6,
        )

        # 검색 ②: 선생님 명시 칭찬 이력
        improvement_results = await _store.search_improvement_noted(
            user_id=user_id,
            exclude_note_id=note_id,
            category_id=category_id,
            folder_id=folder_id,
            query_texts=current_texts[:5],
            limit=10,
        )
    except Exception as e:
        logger.error("벡터 검색 실패: %s", e)
        return {"growth_report": None}

    if not timeline_results and not improvement_results and not recent_notes:
        logger.info("유사 과거 피드백 없음. 성장 리포트 스킵.")
        return {"growth_report": None}

    current_summary = "\n".join(f"- {t}" for t in current_texts)
    recent_context_text = _build_recent_context_text(recent_notes)
    timeline_text = _build_timeline_text(timeline_results)
    improvement_text = _build_improvement_text(improvement_results)

    try:
        llm = _get_llm()
        result = await llm.ainvoke([
            SystemMessage(content=GROWTH_REPORT_SYSTEM_PROMPT),
            HumanMessage(content=(
                f"[오늘 레슨의 핵심 피드백]\n{current_summary}\n\n"
                f"[최근 과거 레슨 요약]\n{recent_context_text}\n\n"
                f"[토픽별 시계열 (과거 유사 피드백)]\n{timeline_text}\n\n"
                f"[선생님 명시 개선 인정 발화]\n{improvement_text}"
            )),
        ])
        growth_report = result.content.strip()
        logger.info("성장 리포트 생성 완료: user_id=%s, note_id=%s", user_id, note_id)
        return {"growth_report": growth_report}
    except Exception as e:
        logger.error("성장 리포트 LLM 호출 실패: %s", e)
        return {"growth_report": None}
