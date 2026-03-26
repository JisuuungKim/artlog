"""
Run only `feedback_analysis_node` against a pre-transcribed text file.

Usage:
  cd ai
  python -m app.graph.run_feedback_analysis

Optional:
  python -m app.graph.run_feedback_analysis --input ../uploads/stt_result.txt --output ../uploads/feedback_analysis_result.json
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

from dotenv import load_dotenv


logger = logging.getLogger(__name__)


def _default_input_path() -> Path:
    repo_root = Path(__file__).resolve().parents[3]
    return repo_root / "uploads" / "stt_result.txt"


def _default_output_path() -> Path:
    repo_root = Path(__file__).resolve().parents[3]
    return repo_root / "uploads" / "feedback_analysis_result.json"


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


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run feedback_analysis_node with a pre-transcribed text file.",
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=_default_input_path(),
        help="Path to the STT text file.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=_default_output_path(),
        help="Path to write the analyzed feedback JSON.",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)-8s | %(name)s - %(message)s",
    )

    env_path = Path(__file__).resolve().parents[2] / ".env"
    load_dotenv(env_path)

    from app.graph.nodes.lesson_note_agent import feedback_analysis_node

    input_path = args.input.resolve()
    output_path = args.output.resolve()

    if not input_path.exists():
        raise FileNotFoundError(f"STT text file not found: {input_path}")

    transcript_text = input_path.read_text(encoding="utf-8").strip()
    if not transcript_text:
        raise ValueError(f"STT text file is empty: {input_path}")

    chunks = _split_into_three_chunks(transcript_text)
    analyzed_feedbacks = []

    logger.info(
        "Running feedback_analysis_node with %s split into %d chunks",
        input_path,
        len(chunks),
    )
    for idx, chunk in enumerate(chunks, start=1):
        logger.info("Running feedback_analysis_node for chunk %d/%d", idx, len(chunks))
        state = {"transcripts": [chunk]}
        result = feedback_analysis_node(state)
        analyzed_feedbacks.extend(result.get("analyzed_feedbacks", []))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(
            [feedback.model_dump() for feedback in analyzed_feedbacks],
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    logger.info(
        "feedback_analysis_node completed: %d feedbacks written to %s",
        len(analyzed_feedbacks),
        output_path,
    )


if __name__ == "__main__":
    main()
