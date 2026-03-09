from pydantic import BaseModel, Field


# ────────────────────────────────────────────────────────────────
# Request
# ────────────────────────────────────────────────────────────────

class LessonNoteRequest(BaseModel):
    """POST /api/v1/lesson-notes/generate 요청 바디."""

    user_id: str = Field(..., description="요청 사용자 ID")
    session_id: str = Field(
        ...,
        description="세션 ID. LangGraph thread_id 로 사용되어 대화 맥락이 유지됩니다.",
    )
    raw_content: str = Field(..., description="레슨 원본 텍스트")


# ────────────────────────────────────────────────────────────────
# Response
# ────────────────────────────────────────────────────────────────

class LessonNoteResponse(BaseModel):
    """POST /api/v1/lesson-notes/generate 응답 바디."""

    session_id: str = Field(..., description="요청에 사용된 세션 ID")
    lesson_note: dict = Field(
        ...,
        description="최종 생성된 레슨노트 정리본 (JSON 구조)",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "session_id": "sess-abc123",
                "lesson_note": {
                    "title": "2026-03-09 레슨 요약",
                    "key_points": ["포인트 1", "포인트 2"],
                    "summary": "오늘 레슨의 핵심 내용 요약...",
                    "action_items": ["다음 레슨까지 연습할 것"],
                },
            }
        }
    }
