# ── 빌드 스테이지 ──────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# 시스템 의존성 (psycopg binary 빌드용)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --prefix=/install --no-cache-dir -r requirements.txt

# ── 공통 런타임 베이스 ─────────────────────────────────────────
FROM python:3.11-slim AS runtime-base

WORKDIR /app

# ffmpeg/ffprobe: 오디오 다운샘플·청크 분할에 필요 (stt_agent.py 가 CLI 직접 호출)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 빌더에서 설치된 패키지만 복사
COPY --from=builder /install /usr/local

EXPOSE 8001

# ── 개발 단계 (소스 마운트 + --reload) ─────────────────────────
FROM runtime-base AS dev

# 소스는 docker-compose가 bind mount로 주입
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

# ── 운영 단계 (소스 굳혀서 복사, --reload 제거) ────────────────
FROM runtime-base AS prod

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
