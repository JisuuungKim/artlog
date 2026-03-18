from pydantic import BaseModel, Field
from typing import List, Optional


# ────────────────────────────────────────────────────────────────
# 공통 서브 모델 (state.py와 맞춤)
# ────────────────────────────────────────────────────────────────

class KeywordItem(BaseModel):
    feedback_keyword_id: str
    feedback_keyword_name: str


# ────────────────────────────────────────────────────────────────
# Request
# ────────────────────────────────────────────────────────────────

class LessonNoteRequest(BaseModel):
    """POST /api/v1/lesson-notes/generate 요청 바디."""

    session_id: str = Field(..., description="세션 ID — LangGraph thread_id로 사용")
    audio_path: str = Field(..., description="컨테이너 내부 오디오 파일 절대 경로")
    song_title: List[str] = Field(default=[], description="레슨에서 다룬 곡 제목 목록")
    keywords: List[KeywordItem] = Field(default=[], description="피드백 카드 분류용 키워드 목록")


# ────────────────────────────────────────────────────────────────
# Response
# ────────────────────────────────────────────────────────────────

class LessonNoteResponse(BaseModel):
    """POST /api/v1/lesson-notes/generate 응답 바디."""

    session_id: str = Field(..., description="요청에 사용된 세션 ID")
    transcript: str = Field(..., description="STT + 보정된 전체 텍스트")
    lesson_note: dict = Field(..., description="최종 생성된 레슨노트 (JSON)")
