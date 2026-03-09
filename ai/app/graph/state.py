from typing import Annotated, Any
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """
    LangGraph 워크플로우 전반에서 공유되는 에이전트 상태.

    각 노드는 여기에 정의된 키를 읽고 업데이트된 값을 반환합니다.
    `messages` 키는 langgraph 내장 reducer(`add_messages`)를 사용하여
    대화 기록을 누적합니다.
    """

    # ── 입력 (요청에서 주입) ───────────────────────────────────────
    user_id: str
    session_id: str
    raw_content: str

    # ── 1단계: 분석 결과 ──────────────────────────────────────────
    analysis_result: str

    # ── 2단계: 요약 결과 ──────────────────────────────────────────
    summary_result: str

    # ── 3단계: 최종 레슨노트 (JSON 구조) ──────────────────────────
    lesson_note: dict[str, Any]

    # ── 대화 기록 (LangGraph reducer 사용) ────────────────────────
    messages: Annotated[list, add_messages]
