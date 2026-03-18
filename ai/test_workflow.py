import asyncio
import logging
from typing import TypedDict
from pathlib import Path

from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from app.core.config import get_settings
from app.graph.state import AgentState, Keyword
from app.graph.nodes.stt_agent import stt_node
from app.graph.nodes.correction_agent import correction_node
from app.graph.nodes.lesson_note_agent import (
    feedback_analysis_node,
    category_classification_node,
    generate_lesson_note_node,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s - %(message)s"
)
logger = logging.getLogger(__name__)


# ── 테스트 입력 데이터 ───────────────────────────────────────────────
TEST_INPUT = {
    "song_title": ["나를 지킨다는 것"],
    "audio_path": "/uploads/test.m4a",  # 실제 파일 경로
    "keywords": [
        {"feedback_keyword_id": "1", "feedback_keyword_name": "호흡/압력"},
        {"feedback_keyword_id": "2", "feedback_keyword_name": "딕션"},
        {"feedback_keyword_id": "3", "feedback_keyword_name": "감정/표현"},
    ],
    "transcripts": [],  # Will be populated below
    "analyzed_feedbacks": [],
    "feedback_categories": [],
    "lesson_note": None,
    "errors": [],
    "retry_count": 0,
}


def get_test_input() -> dict:
    import os
    txt_path = os.path.join(os.path.dirname(__file__), "..", "uploads", "stt_result.txt")
    if os.path.exists(txt_path):
        with open(txt_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            # Split into 3 chunks
            n_chunks = 3
            chunk_size = len(lines) // n_chunks
            
            chunks = []
            for i in range(n_chunks):
                start_idx = i * chunk_size
                # If last chunk, take all remaining lines
                end_idx = (i + 1) * chunk_size if i < n_chunks - 1 else len(lines)
                chunk_text = "".join(lines[start_idx:end_idx]).strip()
                if chunk_text:
                    chunks.append(chunk_text)
                    
            TEST_INPUT["transcripts"] = chunks
    else:
        TEST_INPUT["transcripts"] = ["이 테스트는 더미 텍스트입니다. 가사: 예시", "여기는 두번째 청크 부분입니다."]
        logging.warning("[Test] stt_result.txt를 찾지 못했습니다. 기본 텍스트를 사용합니다.")
    
    return TEST_INPUT


def build_test_graph(use_dummy_stt: bool = True):
    """InMemorySaver를 사용하는 테스트용 그래프를 빌드합니다."""
    builder = StateGraph(AgentState)

    builder.add_node("correction", correction_node)
    builder.add_node("feedback_analysis", feedback_analysis_node)
    builder.add_node("category_classification", category_classification_node)
    builder.add_node("lesson_note", generate_lesson_note_node)

    # 테스트 속도를 위해 STT는 우회 (사전 로드된 transcripts 청크 사용)
    builder.set_entry_point("correction")
    builder.add_edge("correction", "feedback_analysis")
    builder.add_edge("feedback_analysis", "category_classification")
    builder.add_edge("category_classification", "lesson_note")
    builder.add_edge("lesson_note", END)

    return builder.compile(checkpointer=MemorySaver())


# ── 실행 코드 ────────────────────────────────────────────────────────
async def main():
    print("=" * 60)
    print("LangGraph 워크플로우 테스트 시작")
    print(f"오디오 파일: {TEST_INPUT['audio_path']}")
    print("=" * 60)

    graph = build_test_graph()
    config = {"configurable": {"thread_id": "test_thread_002"}}

    initial_state = get_test_input()

    logger.info("파이프라인 실행 시작 (CHUNK START: correction)")
    try:
        final_state = graph.invoke(initial_state, config=config)

        print("\n\n" + "=" * 60)
        print("최종 레슨 노트 결과물")
        print("=" * 60)
        
        lesson_note = final_state.get("lesson_note")
        if lesson_note:
            import json
            print(json.dumps(lesson_note.model_dump(), indent=2, ensure_ascii=False))
        else:
            print("레슨 노트 생성 실패")
            print("Errors:", final_state.get("errors"))
            
        print("=" * 60)
            
    except Exception as e:
        logger.error("워크플로우 실행 중 오류 발생: %s", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
