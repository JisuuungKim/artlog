from fastapi import APIRouter, Request, HTTPException
from app.schema.models import LessonNoteRequest, LessonNoteResponse

router = APIRouter()


@router.post(
    "/generate",
    response_model=LessonNoteResponse,
    summary="레슨노트 생성",
    description=(
        "원본 레슨 텍스트를 분석·요약하고 구조화된 레슨노트 JSON을 반환합니다. "
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
        user_id, session_id, raw_content
    request : Request
        FastAPI Request 객체 — app.state 에서 workflow 를 가져옵니다.

    Returns
    -------
    LessonNoteResponse
        최종 생성된 레슨노트 JSON
    """
    workflow = request.app.state.workflow

    # session_id 를 LangGraph thread_id 로 사용 → 세션 맥락 유지
    config = {"configurable": {"thread_id": body.session_id}}

    initial_state = {
        "user_id": body.user_id,
        "session_id": body.session_id,
        "raw_content": body.raw_content,
        "messages": [],
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

    return LessonNoteResponse(
        session_id=body.session_id,
        lesson_note=lesson_note,
    )
