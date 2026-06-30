"""
stt_agent.py  —  STT Node

gpt-4o-transcribe-diarize 모델을 사용하여 오디오를 전사하고
화자를 자동으로 분리합니다.

메모리 사용량을 최소화하기 위해 오디오를 파이썬 메모리에 전체 로드하지 않습니다.
대신 ffmpeg 로 필요한 구간만 16kHz mono 로 다운샘플하여 디스크의 임시 파일로
잘라낸 뒤(청크당 한 번에 하나씩만 메모리에 올림) OpenAI 로 전송합니다.

- 길이는 ffprobe 로 측정
- CHUNK_SECONDS 단위로 분할하되, 청크 경계 문장 잘림을 줄이기 위해 앞뒤 OVERLAP_SECONDS 만큼 겹쳐서 추출
- 겹친 구간의 세그먼트는 원래 담당 청크 기준으로 정리(dedup)
- STT API 호출은 최대 MAX_STT_WORKERS 개씩 병렬 실행
- 각 청크의 타임스탬프를 오프셋 보정하여 전체 시간 기준으로 통합
"""

import logging
import os
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Any

import openai

from app.core.config import get_settings
from app.graph.state import AgentState

logger = logging.getLogger(__name__)

# ── 상수 ────────────────────────────────────────────────────────────
STT_MODEL = "gpt-4o-transcribe-diarize"
CHUNK_SECONDS = 300           # 5분 단위로 쪼개 병렬 처리 시간을 줄입니다.
OVERLAP_SECONDS = 5           # 청크 경계에서 문장이 잘리는 것을 줄입니다.
MAX_STT_WORKERS = 3           # API rate limit 부담을 피하기 위해 동시 호출 수를 제한합니다.
CHUNK_MS = CHUNK_SECONDS * 1000
OVERLAP_MS = OVERLAP_SECONDS * 1000

# Whisper 계열은 16kHz mono 면 충분합니다. 다운샘플로 메모리/전송량을 크게 줄입니다.
TARGET_SAMPLE_RATE = 16000
TARGET_CHANNELS = 1
BITRATE = "64k"
SPEAKER_NAMES = ["선생님", "학생"]   # 화자 레이블 (SPEAKER_00, SPEAKER_01 순)


@dataclass(frozen=True)
class AudioChunk:
    index: int
    base_start_ms: int
    base_end_ms: int
    export_start_ms: int
    export_end_ms: int


@dataclass(frozen=True)
class ChunkResult:
    index: int
    segments: list[dict]


# ────────────────────────────────────────────────────────────────────
# ffmpeg / ffprobe 유틸
# ────────────────────────────────────────────────────────────────────

def _run_command(cmd: list[str], *, what: str) -> subprocess.CompletedProcess:
    """ffmpeg/ffprobe 를 실행하고 실패하면 stderr 끝부분과 함께 예외를 던집니다."""
    proc = subprocess.run(
        cmd,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if proc.returncode != 0:
        stderr_tail = proc.stderr.decode("utf-8", "ignore").strip()[-500:]
        raise RuntimeError(f"{what} 실패 (exit {proc.returncode}): {stderr_tail}")
    return proc


def _probe_duration_ms(audio_path: str) -> int:
    """ffprobe 로 오디오 전체 길이(ms)를 측정합니다. 전체 디코딩이 없어 메모리를 쓰지 않습니다."""
    proc = _run_command(
        [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path,
        ],
        what="오디오 길이 측정",
    )
    raw = proc.stdout.decode("utf-8", "ignore").strip()
    try:
        seconds = float(raw)
    except ValueError as e:
        raise RuntimeError(f"오디오 길이를 해석할 수 없습니다: {raw!r}") from e
    return int(seconds * 1000)


def _extract_chunk_to_file(audio_path: str, chunk: AudioChunk, dst_path: str) -> None:
    """
    원본에서 [export_start_ms, export_end_ms] 구간만 16kHz mono mp3 로 추출해 디스크에 씁니다.

    -ss 를 -i 앞에 두어 입력 시킹(빠름)을 사용하고, ffmpeg 가 스트리밍으로 처리하므로
    파일 길이와 무관하게 메모리 사용량이 거의 일정합니다.
    """
    start_s = chunk.export_start_ms / 1000.0
    duration_s = (chunk.export_end_ms - chunk.export_start_ms) / 1000.0
    _run_command(
        [
            "ffmpeg",
            "-nostdin",
            "-y",
            "-ss", f"{start_s:.3f}",
            "-t", f"{duration_s:.3f}",
            "-i", audio_path,
            "-vn",                       # 앨범 아트 등 비디오 스트림 제거
            "-ac", str(TARGET_CHANNELS),
            "-ar", str(TARGET_SAMPLE_RATE),
            "-c:a", "libmp3lame",
            "-b:a", BITRATE,
            dst_path,
        ],
        what=f"청크 {chunk.index + 1} 추출",
    )


# ────────────────────────────────────────────────────────────────────
# 세그먼트 처리 유틸
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


def _build_audio_chunks(total_ms: int) -> list[AudioChunk]:
    """전체 길이(ms)만으로 청크 경계를 계산합니다. 오디오 데이터는 다루지 않습니다."""
    chunk_count = max(1, (total_ms + CHUNK_MS - 1) // CHUNK_MS)
    chunks: list[AudioChunk] = []

    for i in range(chunk_count):
        base_start_ms = i * CHUNK_MS
        base_end_ms = min((i + 1) * CHUNK_MS, total_ms)
        export_start_ms = max(0, base_start_ms - OVERLAP_MS)
        export_end_ms = min(total_ms, base_end_ms + OVERLAP_MS)

        chunks.append(
            AudioChunk(
                index=i,
                base_start_ms=base_start_ms,
                base_end_ms=base_end_ms,
                export_start_ms=export_start_ms,
                export_end_ms=export_end_ms,
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


def _transcribe_chunk(
    audio_path: str,
    chunk: AudioChunk,
    api_key: str | None,
    chunk_count: int,
) -> ChunkResult:
    """
    청크 한 개를 디스크로 추출한 뒤 OpenAI STT 를 호출합니다.

    OpenAI STT 호출은 네트워크 작업이라 ThreadPoolExecutor 에서 병렬 실행됩니다.
    추출된 임시 파일은 호출 직후 삭제하여 디스크 사용량도 일정하게 유지합니다.
    """
    logger.info(
        "[stt_node] 청크 %d/%d 호출 (%.1f초~%.1f초, overlap %.1f초~%.1f초)",
        chunk.index + 1,
        chunk_count,
        chunk.base_start_ms / 1000,
        chunk.base_end_ms / 1000,
        chunk.export_start_ms / 1000,
        chunk.export_end_ms / 1000,
    )

    fd, tmp_path = tempfile.mkstemp(
        suffix=".mp3", prefix=f"stt_chunk_{chunk.index + 1}_"
    )
    os.close(fd)

    try:
        _extract_chunk_to_file(audio_path, chunk, tmp_path)

        client = openai.OpenAI(api_key=api_key or None)
        try:
            with open(tmp_path, "rb") as audio_file:
                resp = client.audio.transcriptions.create(
                    model=STT_MODEL,
                    file=audio_file,
                    response_format="diarized_json",
                    chunking_strategy="auto",
                )
        except openai.OpenAIError as e:
            logger.error("[stt_node] 청크 %d API 실패: %s", chunk.index + 1, e)
            raise RuntimeError(f"STT API 호출에 실패했습니다: 청크 {chunk.index + 1}") from e
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass

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

    - ffprobe 로 길이를 재고 300초(5분) 단위로 청크 경계를 계산
    - 각 청크는 ffmpeg 로 16kHz mono 로 다운샘플해 디스크 임시 파일로 추출 (전체 메모리 로드 없음)
    - 청크 앞뒤에 5초 overlap 을 붙여 문장 잘림을 줄임
    - STT API 호출은 최대 3개씩 병렬 실행
    - 전체 결과를 타임스탬프 오프셋 보정 후 "[선생님 MM:SS] 텍스트" 형식으로 통합
    """
    audio_path: str = state["audio_path"]
    logger.info("[stt_node] STT 시작: %s", audio_path)

    settings = get_settings()

    # ── 파일 존재 확인 ──────────────────────────────────────────────
    if not os.path.exists(audio_path):
        logger.error("[stt_node] 파일을 찾을 수 없음: %s", audio_path)
        return {"transcript": "", "errors": [f"오디오 파일을 찾을 수 없습니다: {audio_path}"]}

    # ── 길이 측정 (전체 디코딩 없이 ffprobe) ────────────────────────
    try:
        total_ms = _probe_duration_ms(audio_path)
    except Exception as e:
        logger.error("[stt_node] 길이 측정 실패: %s", e)
        return {"transcript": "", "errors": [f"오디오 길이 측정 실패: {e}"]}

    chunks = _build_audio_chunks(total_ms)
    chunk_count = len(chunks)
    logger.info("[stt_node] 총 %.1f분 → %d개 청크", total_ms / 60_000, chunk_count)

    # ── 전체 화자 맵 (청크 간 일관성 유지) ──────────────────────────
    speaker_map: dict[str, str] = {}   # {SPEAKER_00: "선생님", ...}
    transcripts: list[str]      = []   # 각 청크별 통합 텍스트
    results: list[ChunkResult] = []

    # 청크 추출(ffmpeg) + STT API 호출을 워커당 하나씩 병렬 처리합니다.
    # 동시에 메모리/디스크에 올라오는 청크는 최대 MAX_STT_WORKERS 개로 제한됩니다.
    max_workers = min(MAX_STT_WORKERS, chunk_count)
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(_transcribe_chunk, audio_path, chunk, settings.openai_api_key, chunk_count)
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
