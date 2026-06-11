#!/usr/bin/env bash
# VPS 최초 셋업 스크립트.
#   1) docker / compose 설치
#   2) /opt/artlog 에 레포 clone
#   3) systemd unit 등록
#   4) 방화벽(ufw) 80/443/22 만 허용
#
# 사용 (Ubuntu 24.04 기준, root 권한 필요):
#   curl -fsSL https://raw.githubusercontent.com/<owner>/artlog/main/deploy/bootstrap.sh | sudo REPO_URL=https://github.com/<owner>/artlog.git bash
# 또는 SSH 접속 후:
#   sudo REPO_URL=... bash deploy/bootstrap.sh

set -euo pipefail

REPO_URL="${REPO_URL:?REPO_URL 환경변수가 필요합니다 (예: https://github.com/USER/artlog.git)}"
INSTALL_DIR="${INSTALL_DIR:-/opt/artlog}"

if [[ $EUID -ne 0 ]]; then
    echo "root 권한으로 실행해주세요 (sudo)." >&2
    exit 1
fi

echo "==> 시스템 패키지 업데이트"
apt-get update -y
apt-get install -y ca-certificates curl gnupg git ufw unattended-upgrades

echo "==> Docker 설치 (공식 저장소)"
if ! command -v docker >/dev/null 2>&1; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    . /etc/os-release
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
fi

echo "==> 레포 clone (or pull)"
if [[ ! -d "$INSTALL_DIR/.git" ]]; then
    git clone "$REPO_URL" "$INSTALL_DIR"
else
    git -C "$INSTALL_DIR" pull --ff-only
fi

echo "==> systemd unit 등록"
install -m 0644 "$INSTALL_DIR/deploy/artlog.service" /etc/systemd/system/artlog.service
systemctl daemon-reload
systemctl enable artlog.service

echo "==> 방화벽(ufw) 22/80/443 만 허용"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> 자동 보안 업데이트 활성화"
dpkg-reconfigure --priority=low unattended-upgrades || true

cat <<EOF

✅ 부트스트랩 완료.

다음 단계:
  1) cd $INSTALL_DIR
  2) 환경변수 파일 작성:
       cp .env.prod.example .env.prod                 # DOMAIN, ACME_EMAIL, POSTGRES_*
       cp back/.env.prod.example back/.env.prod       # JWT, OAuth, FRONTEND_BASE_URL
       cp ai/.env.prod.example ai/.env.prod           # OPENAI_API_KEY 등
     모든 POSTGRES_PASSWORD 가 세 파일에서 같아야 합니다.
  3) DNS 의 A 레코드를 이 서버 IP 로 향하게 설정 (DOMAIN).
  4) 각 OAuth 콘솔(Google/Kakao/Apple)에 redirect URI 등록:
       https://<DOMAIN>/login/oauth2/code/{google|kakao|apple}
  5) 서비스 시작:
       sudo systemctl start artlog
       sudo journalctl -u artlog -f         # 로그 확인
  6) 첫 배포 후 back/.env.prod 의 SPRING_JPA_HIBERNATE_DDL_AUTO 를 validate 로 바꿔주세요.
EOF
