#!/usr/bin/env bash
# VPS 위에서 실행되는 배포 스크립트.
#   git pull(compose/Caddy 파일 갱신) → GHCR 로그인 → docker compose pull → up -d
#
# app/ai 이미지는 CI(GitHub Actions)에서 빌드해 GHCR 에 push 하므로
# VPS 에서는 빌드하지 않고 pull 만 한다 (작은 인스턴스 빌드 OOM/타임아웃 방지).
#
# CI 에서 SSH 로 다음을 실행하며, GHCR_TOKEN/GHCR_USER/APP_IMAGE/AI_IMAGE 를 env 로 전달:
#   ssh deploy@vps "cd /opt/artlog && bash deploy/deploy.sh"

set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> git pull"
git fetch --prune origin
git reset --hard origin/main

# CI 가 전달한 토큰으로 GHCR 로그인 (수동 실행 시 이미 로그인돼 있으면 생략 가능)
if [ -n "${GHCR_TOKEN:-}" ]; then
    echo "==> GHCR 로그인"
    echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER:-github}" --password-stdin
fi

echo "==> 이미지 pull"
docker compose --env-file .env.prod \
    -f docker-compose.yml -f docker-compose.prod.yml \
    pull

echo "==> up -d"
docker compose --env-file .env.prod \
    -f docker-compose.yml -f docker-compose.prod.yml \
    up -d --remove-orphans

echo "==> dangling 이미지 정리"
docker image prune -f

echo "✅ 배포 완료"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
