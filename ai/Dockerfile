# ── 빌드 스테이지 ──────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# 시스템 의존성 (psycopg binary 빌드용)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --prefix=/install --no-cache-dir -r requirements.txt

# ── 실행 스테이지 ──────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# 빌더에서 설치된 패키지만 복사
COPY --from=builder /install /usr/local

# 소스 코드 복사
COPY app/ ./app/

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
