import asyncio
import json
import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from app.graph.nodes.lesson_note_agent import MAX_REGEN_ATTEMPTS
from app.schema.models import LessonNoteRequest, LessonNoteResponse

router = APIRouter()
logger = logging.getLogger(__name__)

NEXT_STAGE_BY_COMPLETED_STAGE = {
    "stt": "correction",
    "correction": "feedback_analysis",
    "feedback_analysis": "lesson_note",
    "lesson_note": "review_lesson_note",
    "review_lesson_note": "embed_note",
    "embed_note": "growth_report",
}


def build_initial_state(body: LessonNoteRequest) -> dict:
    return {
        "session_id": body.session_id,
        "user_id": body.user_id,
        "note_id": body.note_id,
        "audio_path": body.audio_path,
        "song_title": body.song_title,
        "keywords": [kw.model_dump() for kw in body.keywords],
        "transcript": "",
        "lesson_note": None,
        "needs_regeneration": False,
        "review_feedback": None,
        "errors": [],
        "retry_count": 0,
        "growth_report": None,
    }


def to_note_dict(lesson_note):
    return (
        lesson_note.model_dump()
        if hasattr(lesson_note, "model_dump")
        else lesson_note
    )


def format_sse(event: str, data: dict) -> str:
    return (
        f"event: {event}\n"
        f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
    )


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

    initial_state = build_initial_state(body)

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
        transcript=final_state.get("transcript", ""),
        lesson_note=to_note_dict(lesson_note),
        growth_report=final_state.get("growth_report"),
    )


@router.post(
    "/generate/stream",
    summary="레슨노트 생성 스트림",
    description="AI Agent 단계 변화를 SSE progress 이벤트로 보내고, 마지막에 result 이벤트를 보냅니다.",
)
async def stream_lesson_note_generation(
    body: LessonNoteRequest,
    request: Request,
) -> StreamingResponse:
    workflow = request.app.state.workflow
    config = {"configurable": {"thread_id": body.session_id}}
    initial_state = build_initial_state(body)

    async def event_stream() -> AsyncIterator[str]:
        state = dict(initial_state)
        last_emitted_stage = None

        def progress(stage: str) -> str:
            nonlocal last_emitted_stage
            last_emitted_stage = stage
            return format_sse("progress", {"stage": stage})

        try:
            yield progress("stt")

            async for update in workflow.astream(
                initial_state,
                config=config,
                stream_mode="updates",
            ):
                for node_name, node_update in update.items():
                    if isinstance(node_update, dict):
                        state.update(node_update)

                    next_stage = NEXT_STAGE_BY_COMPLETED_STAGE.get(node_name)
                    if (
                        node_name == "review_lesson_note"
                        and state.get("needs_regeneration")
                        and state.get("retry_count", 0) < MAX_REGEN_ATTEMPTS
                    ):
                        next_stage = "lesson_note"
                    elif node_name == "review_lesson_note" and not state.get("needs_regeneration"):
                        next_stage = "embed_note"

                    if next_stage and next_stage != last_emitted_stage:
                        yield progress(next_stage)

            lesson_note = state.get("lesson_note")
            if not lesson_note:
                raise RuntimeError("워크플로우가 레슨노트를 반환하지 않았습니다.")

            yield format_sse(
                "result",
                {
                    "session_id": body.session_id,
                    "transcript": state.get("transcript", ""),
                    "lesson_note": to_note_dict(lesson_note),
                    "growth_report": state.get("growth_report"),
                },
            )
        except asyncio.CancelledError:
            logger.info(
                "Lesson note stream cancelled before completion. session_id=%s",
                body.session_id,
            )
            return
        except Exception as exc:
            yield format_sse("error", {"message": str(exc)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
