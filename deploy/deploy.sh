#!/usr/bin/env bash
# VPS 위에서 실행되는 배포 스크립트.
#   git pull → docker compose build → up -d → 정리
#
# GitHub Actions 가 SSH 로 다음을 실행:
#   ssh deploy@vps "cd /opt/artlog && bash deploy/deploy.sh"

set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> git pull"
git fetch --prune origin
git reset --hard origin/main

echo "==> compose build & up"
docker compose --env-file .env.prod \
    -f docker-compose.yml -f docker-compose.prod.yml \
    up -d --build --remove-orphans

echo "==> dangling 이미지 정리"
docker image prune -f

echo "✅ 배포 완료"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
