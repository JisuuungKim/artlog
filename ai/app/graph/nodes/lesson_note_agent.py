"""
lesson_note_agent.py  —  Feedback Analysis and Lesson Note Pipeline

[구조]
1. feedback_analysis_node: 전체 대화록에서 선생님 피드백의 전후 2분 문맥을 파악해 분석 내용 추출
2. generate_lesson_note_node: 개별 피드백 목록과 전체 대화록을 바탕으로 LessonNoteResponse 생성
3. review_lesson_note_node: 섹션 간 중복을 검토하고 필요 시 재생성 여부 판단
"""

import logging
import os
from typing import Any, List

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from app.graph.state import (
    AgentState,
    AnalyzedFeedback,
    LessonNoteResponse,
)
from app.core.config import get_settings

logger = logging.getLogger(__name__)

_llm = None
LYRICS_TAG = "특정 가사 피드백"
PRACTICE_TAG = "직접적인 연습 방법"
ASSIGNMENT_TAG = "다음 레슨 과제"
MAX_REGEN_ATTEMPTS = 2


def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        settings = get_settings()
        if settings.openai_api_key:
            os.environ["OPENAI_API_KEY"] = settings.openai_api_key
        _llm = ChatOpenAI(
            model="gpt-5.4-mini",
            temperature=0,
            api_key=settings.openai_api_key or None,
        )
    return _llm

# =====================================================================
# 1. feedback_analysis_node (피드백 기초 분석)
# =====================================================================

ANALYSIS_SYSTEM_PROMPT = """\
너는 이 레슨의 유일한 기록자이며, 선생님의 모든 감각적 지시를 파악해서 학생이 내일 당장 연습할 수 있는 '몸의 언어'로 번역해야만 해

[임무]
전체 대화록(transcript)을 꼼꼼히 읽으면서 선생님 피드백이 나올 경우,
해당 텍스트 내용의 앞 뒤 5분의 문맥을 파악해서 선생님의 피드백을 분석해서 선생님의 의도를 파악해줘.
선생님의 피드백과 추론, 분석 내용은 10개 내외로 작성해. 노래와 관련된 피드백이 없을 경우 예외로 10개 이하여도 가능해.
** 노래와 관련된 피드백만 파악해줘 **

[출력 단위 (AnalyzedFeedback)]
각 피드백 포인트마다 아래 3가지를 추출/작성해:
1. teacher_context: 선생님이 해당 피드백을 설명하거나 교정하는 과정에서 실제로 한 발화 2~4개를 순서대로 묶어서 적어라. 한 문장만 자르지 말고, 이해에 필요한 앞뒤 발화도 함께 포함해라. 절대 요약하거나 일반적인 말로 바꾸지 마라.
2. related_lyrics: 관련된 가사가 있다면 기재, 없으면 빈 문자열
3. feedback_analysis: 선생님이 지적한 **구체적인 원인과 구체적인 해결책**을 이해하기 쉽게 100자 내외로 작성한다.

[feedback_analysis 작성 규칙]
feedback_analysis 추론 과정을 꼭 따라가면서 심층적으로 분석해라
1) 선생님이 어떤 단어나 구간에서 학생을 멈췄는가?
2) 선생님이 지적을 한 목적은 무엇인가? 앞뒤 약 5분의 문맥을 보고 선생님의 의도를 파악하라.
** feedback_analysis의 예시: 숨을 크게 쉬고 시작하면서 흐름이 끊기고, 소리가 뜨는 원인이 됨. 말하듯 자연스럽게 시작하는 감각이 필요함 **

주의: 절대로 발화를 뭉뚱그리거나 날조하지 말고 실제 피드백을 포착해.
"""

class _FeedbackAnalysisOutput(BaseModel):
    analyzed_feedbacks: List[AnalyzedFeedback]

def feedback_analysis_node(state: AgentState) -> dict[str, Any]:
    transcripts = state.get("transcripts", [])
    logger.info("[feedback_analysis_node] 2분 문맥 기반 피드백 통합 분석 시작 (총 %d청크)...", len(transcripts))
    
    if not transcripts:
        return {"analyzed_feedbacks": []}
        
    structured_llm = _get_llm().with_structured_output(_FeedbackAnalysisOutput)
    all_feedbacks = []

    for idx, chunk in enumerate(transcripts):
        logger.info("[feedback_analysis_node] 청크 %d/%d 분석 중...", idx + 1, len(transcripts))
        try:
            result = structured_llm.invoke([
                SystemMessage(content=ANALYSIS_SYSTEM_PROMPT),
                HumanMessage(content=f"[대화록 전문 (청크 {idx + 1})]\n{chunk}")
            ])
            feedbacks = result.analyzed_feedbacks
            all_feedbacks.extend(feedbacks)
            logger.info("[feedback_analysis_node] 청크 %d 분석 완료: %d개 발견", idx + 1, len(feedbacks))
        except Exception as e:
            logger.error("feedback_analysis_node 청크 %d 실패: %s", idx + 1, e)
        
    return {"analyzed_feedbacks": all_feedbacks}


# =====================================================================
# 2. generate_lesson_note_node (레슨노트 규격 생성)
# =====================================================================

REPORT_SYSTEM_PROMPT = """\
너는 보컬 레슨 최종 노트를 작성하는 헤드 코치야.
가장 중요한 임무는 앞서 도출된 개별 피드백 목록과 전체 대화록을 바탕으로 아래의 **말투(Tone and Manner) 및 디테일 규칙**을 엄격하게 지켜 JSON을 완성하는 것이다.

[절대 말투 규칙 (필독)]
- JSON의 모든 `content`, `fix_direction`, `solution_text`, `next_assignment` 등 설명하는 문장은 절대 서술어(~입니다, ~했습니다, ~음, ~함)로 끝내지 마라.
- **명사형 종결**이나 **명령형/실천형 지시어(`~하기`, `~할 것`)**로 끝마쳐라.
- 선생님의 말을 인용하더라도, 문장의 끝은 반드시 위 규칙을 따를 것.

[🔥 내용 디테일 규칙 (가장 중요) 🔥]
- "발음의 명확성 주의하기", "감정을 담아 부르기", "호흡 조절하기" 같은 뻔하고 일반적인 설명은 절대 쓰지 마라. 그런 내용이 나오면 무조건 감점이다.
- 반드시 **선생님이 실제로 한 말, 비유, 독특한 표현**을 구체적으로 인용해서 써라.
- 예시 (나쁜 예): "고음을 길게 유지하여 부르기"
- 예시 (좋은 예): "고음을 악보 리듬보다 길게 낸다고 생각하고 끝마무리 음까지 한 묶음으로 길게 당겨서 부르기"
- 예시 (나쁜 예): "자음 발음에 주의하여 명확하게 부르기"
- 예시 (좋은 예): "자음을 발음할 때 공기가 새지 않도록 입 밖으로 나가는 공기를 줄이고 영어 발음(g 사운드 등) 하듯 꼭꼭 씹어 발음하기"

[섹션별 작성 규칙]
섹션 별 모든 내용이 겹치지 않게 주의해줘.

[중복 방지 규칙]
- 같은 상황, 같은 가사, 같은 해결책을 key_feedback, practice_guide, next_assignment에 반복해서 넣지 마라.
- 한 피드백 포인트는 가장 적절한 섹션 하나에 우선 배치하고, 다른 섹션에는 다른 포인트를 써라.
- 섹션 간 역할을 분리해라:
  - key_feedback: 핵심 문제 인식
  - practice_guide: 실제 연습 동작과 루틴
  - next_assignment: 다음 레슨 전까지 수행할 과제
- 같은 teacher_context를 여러 섹션에서 재활용하지 마라.

1. key_feedback (3~5개):
  - 선생님이 핵심적으로 짚은 교정 포인트.
  - keyword 태그가 붙은 피드백을 우선 반영해라.
  - title은 구체적인 상황을 담은 '~하기' 형태 (예: '음악보다 반 템포 빨리 준비하기')
2. practice_guide (3~5개):
  - "{practice_tag}" 태그가 붙은 피드백을 우선 사용해라.
  - title은 '~하기' 형태.
3. next_assignment (2~4개):
  - "{assignment_tag}" 태그가 붙은 피드백을 우선 사용해라.
  - 다음 레슨까지 해와야 할 과제 (`~하기`). 일반적이지 않고 구체적이어야 함.
4. feedback_card (5개 이상):
  - 반드시 아래 주어진 [사용 가능한 키워드 목록]의 ID(`feedback_keyword_id`) 중에서만 매핑해라.
  - keyword 태그가 붙은 피드백은 가능한 한 같은 이름의 keyword id로 연결해라.
  - 동일한 키워드라도 지적된 상황이 다르면 분리해라.
  - title/content 역시 `~하기` 톤 사용하며, 뻔한 소리 대신 생동감 있는 선생님 피드백 원문/상황 기록.
5. lyrics_feedback (3개 이상):
  - "{lyrics_tag}" 태그가 붙은 피드백을 우선 사용해라.
  - 부른 가사(`line_text`)에 대한 직접적인 교정.
  - `problem_text`는 구체적인 문제점 요약으로 '~함' 형태.
  - `solution_text`는 선생님의 해결 지시를 구체적으로 넣은 `~할 것` 형태.

[사용 가능한 키워드 목록]
{keyword_list}
"""

def generate_lesson_note_node(state: AgentState) -> dict[str, Any]:
    analyzed_feedbacks = state.get("analyzed_feedbacks", [])
    keywords = state.get("keywords", [])
    transcripts = state.get("transcripts", [])
    review_feedback = (state.get("review_feedback") or "").strip()
    retry_count = state.get("retry_count", 0)
    
    logger.info("[generate_lesson_note_node] 최종 레슨노트 생성 시작 (피드백 %d개, 시도 %d)", len(analyzed_feedbacks), retry_count + 1)
    
    keyword_list_str = "\n".join(
        f"  - ID: {kw['feedback_keyword_id']}, 이름: {kw['feedback_keyword_name']}"
        for kw in keywords
    ) or "  (제공된 키워드 없음)"
    
    feedbacks_text = "\n".join(
        (
            f"- 태그: {', '.join(fb.tags)} | 가사: {fb.related_lyrics or '(없음)'} | "
            f"선생님 발화 묶음: {fb.teacher_context} | 분석: {fb.feedback_analysis}"
        )
        for fb in analyzed_feedbacks
    ) or "(추출된 피드백 없음)"

    full_transcript = "\n".join(transcripts)
    revision_instruction = (
        "[이전 생성본 검토 피드백]\n"
        f"{review_feedback}\n\n"
        "위 피드백을 반드시 반영해서 섹션 간 중복을 줄이고, 서로 다른 피드백 포인트로 다시 구성해."
        if review_feedback
        else ""
    )

    structured_llm = _get_llm().with_structured_output(LessonNoteResponse)
    try:
        lesson_note: LessonNoteResponse = structured_llm.invoke([
            SystemMessage(content=REPORT_SYSTEM_PROMPT.format(
                keyword_list=keyword_list_str,
                lyrics_tag=LYRICS_TAG,
                practice_tag=PRACTICE_TAG,
                assignment_tag=ASSIGNMENT_TAG,
            )),
            HumanMessage(content=(
                f"[분석된 개별 피드백 목록]\n{feedbacks_text}\n\n"
                f"[보정된 전체 대화록]\n{full_transcript}"
                + (f"\n\n{revision_instruction}" if revision_instruction else "")
            ))
        ])
        
        logger.info(
            "[generate_lesson_note_node] 완료 — key:%d, prac:%d, asgn:%d, card:%d, lyric:%d",
            len(lesson_note.key_feedback),
            len(lesson_note.practice_guide),
            len(lesson_note.next_assignment),
            len(lesson_note.feedback_card),
            len(lesson_note.lyrics_feedback),
        )
    except Exception as e:
        logger.error("[generate_lesson_note_node] 실패: %s", e)
        raise RuntimeError("레슨노트 생성 LLM 호출에 실패했습니다.") from e

    return {
        "lesson_note": lesson_note,
        "retry_count": retry_count + 1,
        "needs_regeneration": False,
    }


# =====================================================================
# 3. review_lesson_note_node (섹션 중복 검토)
# =====================================================================

REVIEW_SYSTEM_PROMPT = """\
너는 레슨노트 품질 검수자야.

[임무]
생성된 lesson_note를 검토해서 다음 문제를 판단해라.
1. key_feedback, practice_guide, next_assignment 사이에 같은 상황/같은 해결책/같은 가사/같은 선생님 발언이 과도하게 반복되는가
2. 각 섹션이 서로 다른 역할을 가지지 못하고 비슷한 내용만 반복하는가
3. 다양한 피드백이 있는데 일부만 반복 사용해서 버려진 피드백이 많은가

[판정 기준]
- 중복이 경미하면 통과
- 섹션 간 중복이 뚜렷하거나 다양성이 부족하면 재생성 필요

[출력]
1. needs_regeneration: 재생성이 필요하면 true
2. review_feedback: 재생성이 필요할 때는 겹치는 이유와 다시 생성할 때 피해야 할 중복 패턴을 구체적으로 작성
- 예: "key_feedback와 practice_guide가 모두 호흡 위치 유지 이야기만 반복함. practice_guide는 실제 연습 루틴, next_assignment는 숙제성 행동으로 분리할 것"
"""


class _LessonNoteReviewOutput(BaseModel):
    needs_regeneration: bool
    review_feedback: str


def review_lesson_note_node(state: AgentState) -> dict[str, Any]:
    lesson_note = state.get("lesson_note")
    analyzed_feedbacks = state.get("analyzed_feedbacks", [])

    if not lesson_note:
        return {
            "needs_regeneration": False,
            "review_feedback": "lesson_note가 비어 있어 검토를 건너뜀",
        }

    structured_llm = _get_llm().with_structured_output(_LessonNoteReviewOutput)
    feedbacks_text = "\n".join(
        f"- 태그: {', '.join(fb.tags)} | 가사: {fb.related_lyrics or '(없음)'} | 선생님 발화 묶음: {fb.teacher_context} | 분석: {fb.feedback_analysis}"
        for fb in analyzed_feedbacks
    ) or "(분석된 피드백 없음)"

    try:
        review = structured_llm.invoke([
            SystemMessage(content=REVIEW_SYSTEM_PROMPT),
            HumanMessage(content=(
                f"[분석된 원본 피드백]\n{feedbacks_text}\n\n"
                f"[생성된 lesson_note]\n{lesson_note.model_dump_json(indent=2)}"
            )),
        ])
        return {
            "needs_regeneration": review.needs_regeneration,
            "review_feedback": review.review_feedback.strip(),
        }
    except Exception as e:
        logger.error("[review_lesson_note_node] 실패: %s", e)
        return {
            "needs_regeneration": False,
            "review_feedback": "검토 노드 실패로 현재 결과를 유지",
        }


def route_after_review(state: AgentState) -> str:
    if state.get("needs_regeneration") and state.get("retry_count", 0) < MAX_REGEN_ATTEMPTS:
        return "regenerate"
    return "end"
