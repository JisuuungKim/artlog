"""
stt_agent.py  —  STT Node

gpt-4o-transcribe-diarize 모델을 사용하여 오디오를 전사하고
화자를 자동으로 분리합니다.

- 최대 허용 길이: 1,400초
- 긴 파일은 pydub으로 CHUNK_SECONDS 단위로 분할 후 순차 호출
- 각 청크의 타임스탬프를 오프셋 보정하여 전체 시간 기준으로 통합
"""

import io
import logging
from typing import Any

from pydub import AudioSegment
import openai

from app.graph.state import AgentState

logger = logging.getLogger(__name__)

# ── 상수 ────────────────────────────────────────────────────────────
STT_MODEL = "gpt-4o-transcribe-diarize"
CHUNK_SECONDS = 1200          # 20분 — 1400초 제한보다 여유 있게
CHUNK_MS      = CHUNK_SECONDS * 1000
BITRATE       = "64k"
SPEAKER_NAMES = ["선생님", "학생"]   # 화자 레이블 (SPEAKER_00, SPEAKER_01 순)


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


# ────────────────────────────────────────────────────────────────────
# Node
# ────────────────────────────────────────────────────────────────────

def stt_node(state: AgentState) -> dict[str, Any]:
    """
    LangGraph 노드: audio_path → gpt-4o-transcribe-diarize → transcript

    - 1200초(20분) 단위로 청크 분할
    - 각 청크에 response_format=diarized_json 으로 화자 세그먼트 수신
    - 전체 결과를 타임스탬프 오프셋 보정 후 "[선생님 MM:SS] 텍스트" 형식으로 통합
    """
    audio_path: str = state["audio_path"]
    logger.info("[stt_node] STT 시작: %s", audio_path)

    client = openai.OpenAI()

    # ── 파일 로드 ────────────────────────────────────────────────────
    try:
        audio = AudioSegment.from_file(audio_path)
    except FileNotFoundError:
        logger.error("[stt_node] 파일을 찾을 수 없음: %s", audio_path)
        return {"transcript": "", "errors": [f"오디오 파일을 찾을 수 없습니다: {audio_path}"]}
    except Exception as e:
        logger.error("[stt_node] 파일 로드 실패: %s", e)
        return {"transcript": "", "errors": [f"오디오 파일 로드 실패: {e}"]}

    total_ms    = len(audio)
    chunk_count = max(1, (total_ms + CHUNK_MS - 1) // CHUNK_MS)
    logger.info("[stt_node] 총 %.1f분 → %d개 청크", total_ms / 60_000, chunk_count)

    # ── 전체 화자 맵 (청크 간 일관성 유지) ──────────────────────────
    speaker_map: dict[str, str] = {}   # {SPEAKER_00: "선생님", ...}
    transcripts: list[str]      = []   # 각 청크별 통합 텍스트
    errors:      list[str]      = []

    for i in range(chunk_count):
        start_ms  = i * CHUNK_MS
        end_ms    = min((i + 1) * CHUNK_MS, total_ms)
        offset_s  = start_ms / 1000.0
        chunk     = audio[start_ms:end_ms]

        buf = io.BytesIO()
        buf.name = f"chunk_{i + 1}.mp3"
        try:
            chunk.export(buf, format="mp3", bitrate=BITRATE)
            buf.seek(0)
        except Exception as e:
            logger.error("[stt_node] 청크 %d MP3 변환 실패: %s", i + 1, e)
            errors.append(f"청크 {i + 1} 변환 오류: {e}")
            continue

        logger.info("[stt_node] 청크 %d/%d 호출 (%.1f초~%.1f초)",
                    i + 1, chunk_count, start_ms / 1000, end_ms / 1000)
        try:
            resp = client.audio.transcriptions.create(
                model=STT_MODEL,
                file=buf,
                response_format="diarized_json",
                chunking_strategy="auto",
            )
        except openai.OpenAIError as e:
            logger.error("[stt_node] 청크 %d API 실패: %s", i + 1, e)
            errors.append(f"청크 {i + 1} API 오류: {e}")
            continue

        # 세그먼트 정규화 + 오프셋 보정
        raw_segs = getattr(resp, "segments", None)
        segments = _normalize_segments(raw_segs, offset_s)

        # 새 화자 ID 등록 (청크 간 순서 유지)
        for seg in segments:
            sid = seg.get("speaker", "")
            if sid and sid not in speaker_map:
                idx  = len(speaker_map)
                name = SPEAKER_NAMES[idx] if idx < len(SPEAKER_NAMES) else sid
                speaker_map[sid] = name

        chunk_lines = _format_segments(segments, speaker_map)
        if chunk_lines:
            transcripts.append("\n".join(chunk_lines))
        logger.info("[stt_node] 청크 %d/%d 완료 (%d줄)", i + 1, chunk_count, len(chunk_lines))

    logger.info("[stt_node] STT 완료 — 총 %d개 청크", len(transcripts))
    return {"transcripts": transcripts, **({"errors": errors} if errors else {})}
