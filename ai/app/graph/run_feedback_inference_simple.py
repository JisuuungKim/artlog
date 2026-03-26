"""
Run a simple baseline prompt against a pre-transcribed text file.

This script splits the STT text into 3 chunks, then asks the model a
simple question: infer what teacher feedback exists in each chunk.

Usage:
  cd /Users/jisung/Documents/artlog
  PYTHONPATH=ai python3 -m app.graph.run_feedback_inference_simple
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from app.core.config import get_settings


logger = logging.getLogger(__name__)


class _SimpleFeedbackOutput(BaseModel):
    feedbacks: list[str]


SIMPLE_PROMPT = """\
아래는 보컬 레슨 대화록 일부다.

이 청크 안에서 선생님이 학생에게 준 피드백이 무엇인지 최대한 많이 추론해서 뽑아라.
- 어떤 부분에서 피드백을 했는지 작성하라.
- 중요한 것만 추리지 말고, 피드백처럼 보이는 것은 최대한 많이 포함해라.
- 일반 대화, 추임새, 호응은 제외해라.
- 각 항목은 학생이 고쳐야 할 포인트가 드러나는 한 문장으로 써라.
- 출력은 feedbacks 배열만 반환해라.
"""


def _default_input_path() -> Path:
    repo_root = Path(__file__).resolve().parents[3]
    return repo_root / "uploads" / "stt_result.txt"


def _default_output_path() -> Path:
    repo_root = Path(__file__).resolve().parents[3]
    return repo_root / "uploads" / "feedback_inference_simple_result.json"


def _split_into_three_chunks(text: str) -> list[str]:
    lines = [line for line in text.splitlines() if line.strip()]
    if not lines:
        return []

    chunk_count = min(3, len(lines))
    base_size, remainder = divmod(len(lines), chunk_count)

    chunks: list[str] = []
    start = 0
    for idx in range(chunk_count):
        size = base_size + (1 if idx < remainder else 0)
        end = start + size
        chunk_lines = lines[start:end]
        if chunk_lines:
            chunks.append("\n".join(chunk_lines))
        start = end
    return chunks


def _get_llm() -> ChatOpenAI:
    settings = get_settings()
    if settings.openai_api_key:
        os.environ.setdefault("OPENAI_API_KEY", settings.openai_api_key)
    return ChatOpenAI(model="gpt-4o", temperature=0)


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)-8s | %(name)s - %(message)s",
    )

    env_path = Path(__file__).resolve().parents[2] / ".env"
    load_dotenv(env_path)

    input_path = _default_input_path().resolve()
    output_path = _default_output_path().resolve()

    if not input_path.exists():
        raise FileNotFoundError(f"STT text file not found: {input_path}")

    transcript_text = input_path.read_text(encoding="utf-8").strip()
    if not transcript_text:
        raise ValueError(f"STT text file is empty: {input_path}")

    chunks = _split_into_three_chunks(transcript_text)
    llm = _get_llm().with_structured_output(_SimpleFeedbackOutput)

    merged_results: list[dict[str, object]] = []

    logger.info(
        "Running simple feedback inference with %s split into %d chunks",
        input_path,
        len(chunks),
    )

    for idx, chunk in enumerate(chunks, start=1):
        logger.info("Running simple prompt for chunk %d/%d", idx, len(chunks))
        result = llm.invoke([
            SystemMessage(content=SIMPLE_PROMPT),
            HumanMessage(content=f"[대화록 청크 {idx}]\n{chunk}"),
        ])
        merged_results.append(
            {
                "chunk_index": idx - 1,
                "feedbacks": result.feedbacks,
            }
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(merged_results, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    total_feedbacks = sum(len(item["feedbacks"]) for item in merged_results)
    logger.info(
        "Simple feedback inference completed: %d feedbacks written to %s",
        total_feedbacks,
        output_path,
    )


if __name__ == "__main__":
    main()
