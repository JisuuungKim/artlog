from fastapi import APIRouter, Request, HTTPException
from app.schema.models import LessonNoteRequest, LessonNoteResponse

router = APIRouter()


@router.post(
    "/generate",
    response_model=LessonNoteResponse,
    summary="레슨노트 생성",
    description=(
        "오디오 파일을 STT → 보정 → 레슨노트 생성 파이프라인으로 처리합니다. "
        "`session_id` 를 LangGraph `thread_id` 로 사용하여 세션 간 맥락이 유지됩니다."
    ),
)
async def generate_lesson_note(
    body: LessonNoteRequest,
    request: Request,
) -> LessonNoteResponse:
    """
    POST /api/v1/lesson-notes/generate

    Parameters
    ----------
    body : LessonNoteRequest
        session_id, audio_path, song_title, keywords
    """
    workflow = request.app.state.workflow
    config = {"configurable": {"thread_id": body.session_id}}

    initial_state = {
        "session_id": body.session_id,
        "audio_path": body.audio_path,
        "song_title": body.song_title,
        "keywords": [kw.model_dump() for kw in body.keywords],
        "transcript": "",
        "lesson_note": None,
        "errors": [],
        "retry_count": 0,
    }

    try:
        final_state = await workflow.ainvoke(initial_state, config=config)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"워크플로우 실행 중 오류가 발생했습니다: {exc}",
        ) from exc

    lesson_note = final_state.get("lesson_note")
    if not lesson_note:
        raise HTTPException(
            status_code=500,
            detail="워크플로우가 레슨노트를 반환하지 않았습니다.",
        )

    note_dict = (
        lesson_note.model_dump()
        if hasattr(lesson_note, "model_dump")
        else lesson_note
    )

    return LessonNoteResponse(
        session_id=body.session_id,
        transcript=final_state.get("transcript", ""),
        lesson_note=note_dict,
    )
