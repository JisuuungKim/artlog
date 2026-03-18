"""
test_stt.py — stt_node 단독 테스트

컨테이너 안에서 실행:
    docker exec artlog-ai python test_stt.py

결과를 /uploads/stt_result.txt 에도 저장합니다.
이미 결과 파일이 있으면 API 재호출 없이 바로 출력합니다 (--force 로 강제 재실행).
"""

import os
import sys

AUDIO_PATH  = os.environ.get("TEST_AUDIO_PATH", "/uploads/test.m4a")
RESULT_FILE = "/uploads/stt_result.txt"
FORCE       = "--force" in sys.argv

# ── 이미 결과가 있으면 캐시에서 출력 ────────────────────────────────
if not FORCE and os.path.exists(RESULT_FILE):
    print(f"[캐시] 이전 결과 파일을 읽습니다: {RESULT_FILE}")
    print(f"  (재실행하려면: python test_stt.py --force)\n")
    with open(RESULT_FILE, encoding="utf-8") as f:
        print(f.read())
    sys.exit(0)

# ── 환경변수 확인 ─────────────────────────────────────────────────
required = ["OPENAI_API_KEY"]
missing = [k for k in required if not os.environ.get(k)]
if missing:
    print(f"[ERROR] 환경변수 미설정: {missing}")
    sys.exit(1)

from app.graph.nodes.stt_agent import stt_node

print(f"{'='*55}")
print(f"  stt_node 테스트")
print(f"  오디오: {AUDIO_PATH}")
print(f"{'='*55}\n")

state  = {"audio_path": AUDIO_PATH}
result = stt_node(state)

transcript = result.get("transcript", "")
errors     = result.get("errors", [])

if errors:
    print("[에러 발생]")
    for e in errors:
        print(f"  ✗ {e}")
    sys.exit(1)

if not transcript:
    print("[WARN] transcript가 비어 있습니다.")
else:
    summary = f"\n{'─'*55}\n  총 {len(transcript)}자  |  {transcript.count(chr(10))+1}줄"
    output  = f"[transcript]\n\n{transcript}{summary}"
    print(output)

    with open(RESULT_FILE, "w", encoding="utf-8") as f:
        f.write(output)
    print(f"\n[저장] {RESULT_FILE}")
