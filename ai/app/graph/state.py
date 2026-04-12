from typing import TypedDict, List, Optional
from pydantic import BaseModel, Field


# ── 1. 파이프라인 중간 모델 (피드백 심층 분석) ───────────────────────

class AnalyzedFeedback(BaseModel):
    """feedback_analysis_node 출력 단위"""
    teacher_context: str = Field(
        description="하나의 피드백과 직접 연결된 선생님 발화 여러 개를 순서대로 묶은 원문",
    )
    related_lyrics: Optional[str] = Field(description="관련된 가사 (있을 경우)")
    feedback_analysis: str = Field(description="선생님 피드백 내용 문맥 기반 분석 (50자 이내)")
    tags: List[str] = Field(default_factory=list, description="해당 피드백에 부여된 태그 목록")

# ── 2. 최종 레슨 노트 형태 ──────────────────────────────────────────

class FeedbackCard(BaseModel):
    feedback_keyword_id: str
    title: str
    content: str


class LyricsFeedback(BaseModel):
    line_text: str
    feedback_title: str
    problem_text: str
    solution_text: str


class Keyword(BaseModel):
    feedback_keyword_id: str
    feedback_keyword_name: str


class TitleContent(BaseModel):
    title: str
    content: str


class LessonNoteResponse(BaseModel):
    key_feedback: List[TitleContent] = Field(description="예시) title: 소리의 위치 생각하기 / content: 소리의 위치를 뒤로 빼지 말고 앞쪽으로 더 붙여서 뻗어내기")
    practice_guide: List[TitleContent] = Field(description="예시) title: 호흡 채우고 공간 유지하기 / content: 정수리까지 호흡을 가득 채우고 공간을 유지하며 내뱉기")
    next_assignment: List[str] = Field(description="예시) 공간만 넓게 쓰는 것이 아니라 딕션으로 소리의 밀도를 채우는 감각 익혀오기.")
    feedback_card: List[FeedbackCard] = Field(description="예시) title: 목표 음보다 높은 호흡 채우기 / content: 현재 내야 하는 음보다 한두 음 더 높은 음을 낸다고 생각하고 호흡을 넉넉히 채워야 소리가 안정적으로 나온다.")
    lyrics_feedback: List[LyricsFeedback] = Field(description="예시) line_text: 내가 술래가 되면 / feedback_title: '돼' 를 더 모아서 발음하기 / problem_text: '돼' 발음이 너무 벌어짐 / solution_text: '돼'를 '도해'라고 생각하고 더 모아서 발음할 것")


# ── 3. LangGraph State ───────────────────────────────────────────────
class AgentState(TypedDict):
    # 입력
    user_id: int
    note_id: int
    song_title: List[str]
    keywords: List[Keyword]
    audio_path: str                             # 입력: 녹음 파일 경로
    transcripts: List[str]                      # stt_node 출력 (청크 단위 분리)

    # 5단계 파이프라인 매개 상태
    analyzed_feedbacks: List[AnalyzedFeedback]
    lesson_note: Optional[LessonNoteResponse]   # 최종 결과물
    needs_regeneration: bool
    review_feedback: Optional[str]
    errors: List[str]
    retry_count: int

    # 성장 리포트
    growth_report: Optional[str]
