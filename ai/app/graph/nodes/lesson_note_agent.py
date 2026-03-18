"""
lesson_note_agent.py  —  5-Step Feedback Analysis Pipeline

[구조]
1. feedback_analysis_node: 전체 대화록에서 선생님 피드백의 전후 2분 문맥을 파악해 분석 내용 추출
2. category_classification_node: 유사한 피드백을 카테고리로 묶고, 심층 분석 내용 도출
3. generate_lesson_note_node: 분류된 카테고리 정보와 전체 대화록을 바탕으로 엄격한 말투 규격에 맞게 LessonNoteResponse 생성
"""

import logging
from typing import Any, List

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from app.graph.state import (
    AgentState,
    AnalyzedFeedback,
    FeedbackCategory,
    LessonNoteResponse,
)

logger = logging.getLogger(__name__)

_llm = ChatOpenAI(model="gpt-4o", temperature=0)

# =====================================================================
# 1. feedback_analysis_node (피드백 기초 분석)
# =====================================================================

ANALYSIS_SYSTEM_PROMPT = """\
너는 이 레슨의 유일한 기록자이며, 선생님의 모든 감각적 지시를 추론해서 학생이 내일 당장 연습할 수 있는 '몸의 언어'로 번역해야만 해

[임무]
전체 대화록(transcript)을 꼼꼼히 읽으면서 선생님 피드백이 나올 경우,
해당 텍스트 내용의 문맥을 파악해서 선생님의 피드백을 분석해줘.
선생님의 피드백과 추론, 분석 내용은 30개 이상으로 작성해.

[출력 단위 (AnalyzedFeedback)]
각 피드백 포인트마다 아래 3가지를 추출/작성해:
1. teacher_quote: 선생님이 실제로 내뱉은 **날것 그대로의 발언(따옴표로 묶어도 됨)**을 추출하라. 절대 요약하거나 일반적인 말로 바꾸지 마라.
2. related_lyrics: 관련된 가사가 있다면 기재, 없으면 빈 문자열
3. feedback_analysis: 선생님이 지적한 **구체적인 원인과 구체적인 해결책**을 맥락을 바탕으로 추론한 후 100자 내외로 작성한다.
- feedback_analysis 추론 과정을 꼭 따라가면서 심층적으로 분석해라
1) 선생님이 어떤 단어나 구간에서 학생을 멈췄는가?
2) 선생님이 지적을 한 목적은 무엇인가? 보컬 트레이너 관점에서 구체적으로 추론할 것
3) 학생이 내일 연습실에서 바로 따라 할 수 있는 **'감각적인 행동 지침'**으로 변환하라.


주의: 절대로 발화를 뭉뚱그리거나 날조하지 말고, 대화록에 있는 선생님의 실제 피드백 지점들을 놓치지 말고 최대한 많이 포착해.
"""

class _FeedbackAnalysisOutput(BaseModel):
    analyzed_feedbacks: List[AnalyzedFeedback]

def feedback_analysis_node(state: AgentState) -> dict[str, Any]:
    transcripts = state.get("transcripts", [])
    logger.info("[feedback_analysis_node] 2분 문맥 기반 피드백 통합 분석 시작 (총 %d청크)...", len(transcripts))
    
    if not transcripts:
        return {"analyzed_feedbacks": []}
        
    structured_llm = _llm.with_structured_output(_FeedbackAnalysisOutput)
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
# 2. category_classification_node (카테고리 분류 및 심층 분석)
# =====================================================================

CATEGORY_SYSTEM_PROMPT = """\
너는 앞서 1차로 분석된 개별 보컬 피드백들을 종합적으로 살펴보고 심층 분석하는 수석 코치야.

[임무]
주어진 피드백 목록(analyzed_feedbacks)을 바탕으로, 유사한 피드백들을 카테고리로 분류해.
단, 카테고리 이름 자체도 '발음', '호흡' 같은 뻔한 단어보다는 '자음 조음 시 공기 새는 문제 교정', '음악보다 반 템포 빨리 나오는 리듬감' 처럼 구체적으로 달아.
그리고 각 카테고리 내의 피드백 원문, 관련 가사, 피드백 분석 내용을 꼼꼼히 확인해서,
해당 카테고리에 대한 **심층적인 보컬 피드백 내용 분석**을 진행해줘.

[출력 단위 (FeedbackCategory)]
각 카테고리마다 다음을 작성해:
1. category_name: 디테일하고 구체적인 카테고리 명칭 (일반화된 명칭 절대 금지)
2. category_analysis: 해당 카테고리에 속한 피드백들을 관통하는 심층 분석 내용. **원인**, **구체적인 해결 방법**, 선생님이 강조한 비유나 실제 표현을 적극 인용할 것. 200자 내외로 심층적으로 작성.
3. feedbacks: 이 카테고리에 속하는 AnalyzedFeedback 원본 리스트.
"""

class _CategoryClassificationOutput(BaseModel):
    feedback_categories: List[FeedbackCategory]

def category_classification_node(state: AgentState) -> dict[str, Any]:
    analyzed_feedbacks = state.get("analyzed_feedbacks", [])
    logger.info("[category_classification_node] 피드백 카테고리 심층 분석 시작 (피드백 %d개)", len(analyzed_feedbacks))
    
    if not analyzed_feedbacks:
        return {"feedback_categories": []}
        
    feedbacks_text = "\n".join([f"- 가사: {fb.related_lyrics} | 원문: {fb.teacher_quote}\n  분석: {fb.feedback_analysis}" for fb in analyzed_feedbacks])
    
    structured_llm = _llm.with_structured_output(_CategoryClassificationOutput)
    try:
        result = structured_llm.invoke([
            SystemMessage(content=CATEGORY_SYSTEM_PROMPT),
            HumanMessage(content=f"[1차 피드백 분석 결과]\n{feedbacks_text}")
        ])
        categories = result.feedback_categories
        logger.info("[category_classification_node] %d개의 카테고리로 분류 및 심층 분석 완료", len(categories))
    except Exception as e:
        logger.error("category_classification_node 실패: %s", e)
        categories = []
        
    return {"feedback_categories": categories}


# =====================================================================
# 3. generate_lesson_note_node (레슨노트 규격 생성)
# =====================================================================

REPORT_SYSTEM_PROMPT = """\
너는 보컬 레슨 최종 노트를 작성하는 헤드 코치야.
가장 중요한 임무는 앞서 도출된 심층 분석 카테고리 정보와 전체 대화록을 바탕으로 아래의 **말투(Tone and Manner) 및 디테일 규칙**을 엄격하게 지켜 JSON을 완성하는 것이다.

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

1. key_feedback (3~5개):
  - 선생님이 핵심적으로 짚은 교정 포인트.
  - title은 구체적인 상황을 담은 '~하기' 형태 (예: '음악보다 반 템포 빨리 준비하기')
2. practice_guide (3~5개):
  - 선생님이 중요하게 이야기 한 연습 방법.
  - title은 '~하기' 형태.
3. next_assignment (2~4개):
  - 다음 레슨까지 해와야 할 과제 (`~하기`). 일반적이지 않고 구체적이어야 함.
4. feedback_card (5개 이상):
  - 반드시 아래 주어진 [사용 가능한 키워드 목록]의 ID(`feedback_keyword_id`) 중에서만 매핑해라.
  - 동일한 키워드라도 지적된 상황이 다르면 분리해라.
  - title/content 역시 `~하기` 톤 사용하며, 뻔한 소리 대신 생동감 있는 선생님 피드백 원문/상황 기록.
5. lyrics_feedback (3개 이상):
  - 부른 가사(`line_text`)에 대한 직접적인 교정.
  - `problem_text`는 구체적인 문제점 요약으로 '~함' 형태.
  - `solution_text`는 선생님의 해결 지시를 구체적으로 넣은 `~할 것` 형태.

[사용 가능한 키워드 목록]
{keyword_list}
"""

def generate_lesson_note_node(state: AgentState) -> dict[str, Any]:
    categories = state.get("feedback_categories", [])
    keywords = state.get("keywords", [])
    transcripts = state.get("transcripts", [])
    
    logger.info("[generate_lesson_note_node] 최종 레슨노트 생성 시작 (카테고리 %d개)", len(categories))
    
    keyword_list_str = "\n".join(
        f"  - ID: {kw['feedback_keyword_id']}, 이름: {kw['feedback_keyword_name']}"
        for kw in keywords
    ) or "  (제공된 키워드 없음)"
    
    categories_text = ""
    for c in categories:
        categories_text += f"\n\n[카테고리: {c.category_name}]\n심층분석: {c.category_analysis}\n포함된 피드백들:\n"
        for fb in c.feedbacks:
            categories_text += f" - 가사: {fb.related_lyrics} | 선생님: {fb.teacher_quote} | 분석: {fb.feedback_analysis}\n"

    # 최종 생성을 위한 전체 대화록 통합본
    full_transcript = "\n".join(transcripts)

    structured_llm = _llm.with_structured_output(LessonNoteResponse)
    try:
        lesson_note: LessonNoteResponse = structured_llm.invoke([
            SystemMessage(content=REPORT_SYSTEM_PROMPT.format(keyword_list=keyword_list_str)),
            HumanMessage(content=f"[심층 분석된 피드백 정보 및 카테고리 분류]\n{categories_text}\n")
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
        empty = LessonNoteResponse(key_feedback=[], practice_guide=[], next_assignment=[], feedback_card=[], lyrics_feedback=[])
        return {"lesson_note": empty}

    return {"lesson_note": lesson_note}
