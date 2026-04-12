"""
stt_agent.py  —  STT Node

gpt-4o-transcribe-diarize 모델을 사용하여 오디오를 전사하고
화자를 자동으로 분리합니다.

- 최대 허용 길이: 1,400초
- 긴 파일은 pydub으로 CHUNK_SECONDS 단위로 분할 후 병렬 호출
- 각 청크의 타임스탬프를 오프셋 보정하여 전체 시간 기준으로 통합
"""

import io
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Any

from pydub import AudioSegment
import openai

from app.core.config import get_settings
from app.graph.state import AgentState

logger = logging.getLogger(__name__)

# ── 상수 ────────────────────────────────────────────────────────────
STT_MODEL = "gpt-4o-transcribe-diarize"
CHUNK_SECONDS = 300           # 5분 단위로 쪼개 병렬 처리 시간을 줄입니다.
OVERLAP_SECONDS = 5           # 청크 경계에서 문장이 잘리는 것을 줄입니다.
MAX_STT_WORKERS = 3           # API rate limit 부담을 피하기 위해 동시 호출 수를 제한합니다.
CHUNK_MS      = CHUNK_SECONDS * 1000
OVERLAP_MS    = OVERLAP_SECONDS * 1000
BITRATE       = "64k"
SPEAKER_NAMES = ["선생님", "학생"]   # 화자 레이블 (SPEAKER_00, SPEAKER_01 순)


@dataclass(frozen=True)
class AudioChunk:
    index: int
    base_start_ms: int
    base_end_ms: int
    export_start_ms: int
    export_end_ms: int
    audio_bytes: bytes


@dataclass(frozen=True)
class ChunkResult:
    index: int
    segments: list[dict]


# ────────────────────────────────────────────────────────────────────
# 내부 유틸
# ────────────────────────────────────────────────────────────────────

def _format_segments(segments: list[dict], speaker_map: dict[str, str]) -> list[str]:
    """
    세그먼트 배열 → "[화자 MM:SS] 텍스트" 줄 목록 변환.
    speaker_map 은 전체 청크에 걸쳐 누적된 {SPEAKER_ID: 이름} 딕셔너리.
    """
    lines: list[str] = []
    for seg in segments:
        sid   = seg.get("speaker", "")
        text  = (seg.get("text") or "").strip()
        start = seg.get("start", 0)

        if not text:
            continue

        label = speaker_map.get(sid, sid)
        mm, ss = divmod(int(start), 60)
        lines.append(f"[{label} {mm:02d}:{ss:02d}] {text}")

    return lines


def _normalize_segments(raw, offset_sec: float) -> list[dict]:
    """
    API 응답(pydantic 객체 또는 dict)을 dict 리스트로 정규화하고,
    타임스탬프에 청크 시작 오프셋을 더합니다.
    """
    if raw is None:
        return []
    if isinstance(raw, list):
        items = raw
    else:
        items = []

    result: list[dict] = []
    for s in items:
        if hasattr(s, "__dict__"):
            d = {k: v for k, v in s.__dict__.items() if not k.startswith("_")}
        elif hasattr(s, "model_dump"):
            d = s.model_dump()
        elif isinstance(s, dict):
            d = dict(s)
        else:
            continue

        # 타임스탬프 오프셋 보정
        for key in ("start", "end"):
            if key in d and d[key] is not None:
                d[key] = float(d[key]) + offset_sec

        result.append(d)

    return result


def _build_audio_chunks(audio: AudioSegment, total_ms: int) -> list[AudioChunk]:
    chunk_count = max(1, (total_ms + CHUNK_MS - 1) // CHUNK_MS)
    chunks: list[AudioChunk] = []

    for i in range(chunk_count):
        base_start_ms = i * CHUNK_MS
        base_end_ms = min((i + 1) * CHUNK_MS, total_ms)
        export_start_ms = max(0, base_start_ms - OVERLAP_MS)
        export_end_ms = min(total_ms, base_end_ms + OVERLAP_MS)
        chunk = audio[export_start_ms:export_end_ms]

        buf = io.BytesIO()
        buf.name = f"chunk_{i + 1}.mp3"
        try:
            chunk.export(buf, format="mp3", bitrate=BITRATE)
        except Exception as e:
            logger.error("[stt_node] 청크 %d MP3 변환 실패: %s", i + 1, e)
            raise RuntimeError(f"청크 {i + 1} MP3 변환에 실패했습니다.") from e

        chunks.append(
            AudioChunk(
                index=i,
                base_start_ms=base_start_ms,
                base_end_ms=base_end_ms,
                export_start_ms=export_start_ms,
                export_end_ms=export_end_ms,
                audio_bytes=buf.getvalue(),
            )
        )

    return chunks


def _remove_overlap_segments(chunk: AudioChunk, segments: list[dict]) -> list[dict]:
    """겹쳐 넣은 앞뒤 5초 구간은 원래 담당 청크의 세그먼트만 남깁니다."""
    base_start_s = chunk.base_start_ms / 1000.0
    base_end_s = chunk.base_end_ms / 1000.0
    filtered: list[dict] = []

    for seg in segments:
        start = seg.get("start")
        if start is None:
            continue
        if base_start_s <= float(start) < base_end_s:
            filtered.append(seg)

    return filtered


def _transcribe_chunk(chunk: AudioChunk, api_key: str | None, chunk_count: int) -> ChunkResult:
    """OpenAI STT 호출은 네트워크 작업이라 ThreadPoolExecutor에서 병렬 실행합니다."""
    buf = io.BytesIO(chunk.audio_bytes)
    buf.name = f"chunk_{chunk.index + 1}.mp3"

    logger.info(
        "[stt_node] 청크 %d/%d 호출 (%.1f초~%.1f초, overlap %.1f초~%.1f초)",
        chunk.index + 1,
        chunk_count,
        chunk.base_start_ms / 1000,
        chunk.base_end_ms / 1000,
        chunk.export_start_ms / 1000,
        chunk.export_end_ms / 1000,
    )

    client = openai.OpenAI(api_key=api_key or None)
    try:
        resp = client.audio.transcriptions.create(
            model=STT_MODEL,
            file=buf,
            response_format="diarized_json",
            chunking_strategy="auto",
        )
    except openai.OpenAIError as e:
        logger.error("[stt_node] 청크 %d API 실패: %s", chunk.index + 1, e)
        raise RuntimeError(f"STT API 호출에 실패했습니다: 청크 {chunk.index + 1}") from e

    segments = _normalize_segments(
        getattr(resp, "segments", None),
        chunk.export_start_ms / 1000.0,
    )
    segments = _remove_overlap_segments(chunk, segments)

    logger.info("[stt_node] 청크 %d/%d 완료 (%d 세그먼트)", chunk.index + 1, chunk_count, len(segments))
    return ChunkResult(index=chunk.index, segments=segments)


# ────────────────────────────────────────────────────────────────────
# Node
# ────────────────────────────────────────────────────────────────────

def stt_node(state: AgentState) -> dict[str, Any]:
    """
    LangGraph 노드: audio_path → gpt-4o-transcribe-diarize → transcript

    - 300초(5분) 단위로 청크 분할
    - 각 청크 앞뒤에 5초 overlap 을 붙여 문장 잘림을 줄임
    - STT API 호출은 최대 3개씩 병렬 실행
    - 전체 결과를 타임스탬프 오프셋 보정 후 "[선생님 MM:SS] 텍스트" 형식으로 통합
    """
    audio_path: str = state["audio_path"]
    logger.info("[stt_node] STT 시작: %s", audio_path)

    settings = get_settings()

    # ── 파일 로드 ────────────────────────────────────────────────────
    try:
        audio = AudioSegment.from_file(audio_path)
    except FileNotFoundError:
        logger.error("[stt_node] 파일을 찾을 수 없음: %s", audio_path)
        return {"transcript": "", "errors": [f"오디오 파일을 찾을 수 없습니다: {audio_path}"]}
    except Exception as e:
        logger.error("[stt_node] 파일 로드 실패: %s", e)
        return {"transcript": "", "errors": [f"오디오 파일 로드 실패: {e}"]}

    total_ms = len(audio)
    chunks = _build_audio_chunks(audio, total_ms)
    chunk_count = len(chunks)
    logger.info("[stt_node] 총 %.1f분 → %d개 청크", total_ms / 60_000, chunk_count)

    # ── 전체 화자 맵 (청크 간 일관성 유지) ──────────────────────────
    speaker_map: dict[str, str] = {}   # {SPEAKER_00: "선생님", ...}
    transcripts: list[str]      = []   # 각 청크별 통합 텍스트
    results: list[ChunkResult] = []

    # STT API 호출만 병렬화합니다. 결과는 아래에서 다시 청크 index 기준으로 정렬합니다.
    max_workers = min(MAX_STT_WORKERS, chunk_count)
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(_transcribe_chunk, chunk, settings.openai_api_key, chunk_count)
            for chunk in chunks
        ]
        for future in as_completed(futures):
            results.append(future.result())

    for result in sorted(results, key=lambda item: item.index):
        # 새 화자 ID 등록 (청크 간 순서 유지)
        for seg in result.segments:
            sid = seg.get("speaker", "")
            if sid and sid not in speaker_map:
                idx  = len(speaker_map)
                name = SPEAKER_NAMES[idx] if idx < len(SPEAKER_NAMES) else sid
                speaker_map[sid] = name

        chunk_lines = _format_segments(result.segments, speaker_map)
        if chunk_lines:
            transcripts.append("\n".join(chunk_lines))
        logger.info("[stt_node] 청크 %d/%d 병합 완료 (%d줄)", result.index + 1, chunk_count, len(chunk_lines))

    logger.info("[stt_node] STT 완료 — 총 %d개 청크", len(transcripts))
    if not transcripts:
        raise RuntimeError("STT 결과가 비어 있습니다.")
    return {"transcripts": transcripts}
