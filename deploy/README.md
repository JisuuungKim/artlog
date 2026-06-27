# 배포 가이드 (프론트 = Vercel / 백엔드 = AWS EC2 + Docker Compose + Caddy + systemd)

배포가 **두 군데로 분리**되어 있습니다.

- **프론트 (React/Vite PWA)** → **Vercel**. 정적 빌드 + CDN + 자동 HTTPS. (이 README 의 §11)
- **백엔드 스택 (`db`, `redis`, `app`, `ai`, `caddy`)** → **AWS EC2 단일 VPS**.
  docker compose 한 묶음으로 띄우고 Caddy 가 API 도메인에 자동 HTTPS + 리버스 프록시.

도메인은 **같은 루트도메인의 두 호스트**를 씁니다 (예시 기준):

| 역할 | 도메인 | 호스팅 |
|---|---|---|
| 프론트 | `artlog.site` (또는 `www.artlog.site`) | Vercel |
| API | `api.artlog.site` | EC2 / Caddy |

> 같은 루트도메인(`artlog.site`)이라 refresh token 쿠키가 same-site 로 동작합니다
> (`REFRESH_COOKIE_SAME_SITE=Lax`). 프론트를 `*.vercel.app` 같은 다른 사이트로 두면
> `REFRESH_COOKIE_SAME_SITE=None` 으로 바꿔야 로그인 갱신이 됩니다.

## 0. 준비물

- 도메인 1개 (예: `artlog.site`) — 프론트/`api` 서브도메인에 사용
- Vercel 계정 (GitHub 연동)
- 가입된 OAuth 앱 (Google / Kakao / Apple) — redirect URI 추가 등록 필요
- AWS 계정

## 1. EC2 인스턴스 생성

| 항목 | 추천 |
|---|---|
| AMI | Ubuntu 24.04 LTS (Canonical 공식) |
| Instance Type | `t4g.medium` (ARM, 2 vCPU / 4 GB, 약 $24/mo) 또는 `t3.medium` (x86, 약 $30/mo) |
| Storage | 30 GB gp3 |
| Security Group | inbound 22(내 IP만) / 80(0.0.0.0/0) / 443(0.0.0.0/0) |
| Elastic IP | 1개 할당 후 인스턴스에 연결 (도메인이 IP 변경 안 따라가도 되도록) |

> ARM(Graviton)을 쓰면 비용이 ~20% 싸지만 docker 이미지가 multi-arch 여야 합니다.
> 현재 사용 이미지(`pgvector/pgvector:pg15`, `redis:7-alpine`, `caddy:2-alpine`,
> `eclipse-temurin:17-*`, `python:3.11-slim`, `nginx:alpine`)는 모두 arm64 지원.

## 2. DNS 설정

도메인 DNS 에 레코드 2개:
- `api.artlog.site` → A 레코드 → EIP 주소 (EC2/Caddy)
- `artlog.site` (프론트) → Vercel 안내대로 (보통 apex 는 A `76.76.21.21`, `www` 는 CNAME `cname.vercel-dns.com`). 정확한 값은 Vercel 의 Domains 화면이 알려줍니다.

전파 후 `dig api.artlog.site` 으로 API 도메인 확인.

## 3. VPS 부트스트랩

EC2 에 SSH 접속 후:

```bash
# 1) 레포 가져와 부트스트랩 (root 권한 필요)
sudo REPO_URL=https://github.com/<owner>/artlog.git \
    bash -c 'curl -fsSL https://raw.githubusercontent.com/<owner>/artlog/main/deploy/bootstrap.sh | bash'
```

부트스트랩이 처리하는 것:
- `docker` + `docker compose` 플러그인 설치
- `/opt/artlog` 에 레포 clone
- `artlog.service` systemd unit 등록 + enable (부팅 시 자동 기동)
- `ufw` 로 22/80/443 만 허용
- `unattended-upgrades` 활성화

## 4. 환경변수 작성

```bash
cd /opt/artlog
sudo cp .env.prod.example      .env.prod
sudo cp back/.env.prod.example back/.env.prod
sudo cp ai/.env.prod.example   ai/.env.prod
```

세 파일을 열어 값 채우기 (`<API_DOMAIN>`=`api.artlog.site`, `<FRONT_DOMAIN>`=`artlog.site`):
- `.env.prod` — `DOMAIN=<API_DOMAIN>`, `ACME_EMAIL`, `POSTGRES_PASSWORD`
- `back/.env.prod` — `JWT_SECRET`(긴 랜덤), `SPRING_DATASOURCE_PASSWORD`(= 위와 동일),
  `FRONTEND_BASE_URL=https://<FRONT_DOMAIN>`, `OAUTH2_*=https://<FRONT_DOMAIN>/...`,
  `REFRESH_COOKIE_SAME_SITE=Lax`(같은 루트도메인) 또는 `None`(다른 사이트),
  `*_CLIENT_ID/SECRET`(Google/Kakao/Apple)
- `ai/.env.prod` — `POSTGRES_PASSWORD`(= 위와 동일), `OPENAI_API_KEY`

> 세 파일에 들어가는 `POSTGRES_PASSWORD` 가 모두 동일해야 합니다.
> `DOMAIN` 은 **API 도메인**(Caddy 가 인증서 받는 곳), `FRONTEND_BASE_URL` 은 **Vercel 프론트 도메인** 입니다. 헷갈리지 마세요.

## 5. OAuth 콘솔에 redirect URI 추가

OAuth 인증 콜백은 **API 도메인**에서 처리됩니다. 각 콘솔에 아래 URL을 redirect 등록:
- `https://<API_DOMAIN>/login/oauth2/code/google`
- `https://<API_DOMAIN>/login/oauth2/code/kakao`
- `https://<API_DOMAIN>/login/oauth2/code/apple`

> 즉 `https://api.artlog.site/login/oauth2/code/...` 입니다 (프론트 도메인 아님).

## 6. 첫 기동

```bash
sudo systemctl start artlog
sudo journalctl -u artlog -f       # 로그 실시간 확인
```

순서:
1. compose 가 이미지를 빌드 (Spring 2~3분 / FastAPI 1분). **프론트는 VPS 에서 빌드하지 않습니다.**
2. db / redis 부터 올라오고
3. app, ai 가 db 헬스체크 통과 후 기동
4. Caddy 가 시작되며 Let's Encrypt 인증서 자동 발급 (API 도메인이 인스턴스를 가리켜야 성공)

확인: `curl https://<API_DOMAIN>/api/v1/health` 가 정상 응답하면 OK.
(API 도메인 루트 `/` 는 SPA 가 없으므로 404 가 정상입니다 — 화면은 Vercel 프론트에서 봅니다.)

## 7. 첫 배포 직후 한 가지 변경

`back/.env.prod` 에서 첫 배포는 스키마 자동 생성을 위해
`SPRING_JPA_HIBERNATE_DDL_AUTO=update` 로 두었습니다. **첫 배포 후**에는
운영 안전성을 위해 `validate` 로 바꿔주세요:

```bash
sudo nano back/.env.prod
# SPRING_JPA_HIBERNATE_DDL_AUTO=validate
sudo systemctl restart artlog
```

## 8. GitHub Actions 자동 배포 셋업

리포지토리 Settings → Secrets and variables → Actions 에 추가:
- `SSH_HOST` — EIP 또는 도메인
- `SSH_USER` — `ubuntu` (Ubuntu AMI 기본 사용자)
- `SSH_PRIVATE_KEY` — 배포용 SSH 개인키 (EC2 등록한 키페어의 private)
- `SSH_PORT` — 22 (생략 가능)

`/opt/artlog` 의 소유자가 `ubuntu` 가 아니면 (bootstrap 이 root 로 git clone 했음)
배포 사용자가 쓸 수 있도록 권한 조정:

```bash
sudo chown -R ubuntu:ubuntu /opt/artlog
sudo usermod -aG docker ubuntu      # docker 명령 sudo 없이
```

이후 `main` 브랜치에 push 하면 `.github/workflows/deploy.yml` 이
SSH 로 들어가 `deploy/deploy.sh` 를 실행합니다 (git pull → build → up -d).

## 9. 운영 명령

```bash
# 상태 확인
sudo systemctl status artlog
docker compose -f /opt/artlog/docker-compose.yml \
               -f /opt/artlog/docker-compose.prod.yml ps

# 로그
sudo journalctl -u artlog -f
docker logs -f artlog-app
docker logs -f artlog-ai
docker logs -f artlog-caddy

# 재시작 (코드 변경 반영)
cd /opt/artlog && bash deploy/deploy.sh

# 정지 / 시작
sudo systemctl stop artlog
sudo systemctl start artlog
```

## 10. 트러블슈팅

| 증상 | 확인 |
|---|---|
| Caddy 가 인증서 발급 실패 | `api` DNS A 레코드가 EIP 를 가리키는지, 80 포트가 열려있는지 |
| `app` 이 db 에 접속 못 함 | `back/.env.prod` 의 비번이 `.env.prod` 와 같은지 |
| `ai` 가 pgvector 확장 없다고 함 | `EmbeddingStore.setup()` 이 자동 `CREATE EXTENSION` 하지만 권한 부족 시 직접: `docker exec -it artlog-db psql -U artlog_user -d artlog_db -c 'CREATE EXTENSION IF NOT EXISTS vector;'` |
| 프론트에서 API 호출이 CORS 로 막힘 | `back/.env.prod` 의 `FRONTEND_BASE_URL` 이 실제 Vercel 도메인과 정확히 일치하는지(스킴·서브도메인 포함) |
| 로그인은 되는데 새로고침/재방문 시 로그아웃됨 | refresh 쿠키 미전송. `REFRESH_COOKIE_SAME_SITE`(같은 루트도메인=Lax, 다른 사이트=None) + 양쪽 HTTPS 확인 |
| Vercel 빌드에 API 주소가 안 들어감 | Vercel 환경변수 `VITE_API_BASE_URL` 설정 후 **재배포**(빌드 타임 주입이라 기존 빌드엔 반영 안 됨) |
| 메모리 부족 | `t4g.large`/`t3.large` 로 업스케일, 또는 swap 1~2GB 추가 |
| 빌드가 OOM | 빌드만 로컬에서 한 뒤 GHCR push 모델로 전환 (별도 가이드 필요) |

## 11. 프론트 배포 (Vercel)

프론트는 GitHub 레포를 Vercel 에 연결하면 push 마다 자동 배포됩니다 (VPS 와 무관).

1. **프로젝트 생성**: vercel.com → Add New → Project → 이 레포 import.
2. **빌드 설정** (모노레포라 루트 지정 필수):
   - Root Directory: `front`
   - Framework Preset: `Vite` (자동 감지)
   - Build Command: `npm run build` / Output Directory: `dist` (기본값)
   - `front/vercel.json` 이 SPA fallback(`/(.*) → /index.html`)을 처리합니다.
3. **환경변수** (Settings → Environment Variables, Production):
   - `VITE_API_BASE_URL = https://api.artlog.site`
   - Vite 는 **빌드 타임**에 주입하므로, 값 변경 시 반드시 재배포(Redeploy)해야 반영됩니다.
4. **커스텀 도메인**: Settings → Domains 에서 `artlog.site`(+`www`) 추가 → 안내하는 DNS 레코드 등록.
5. **배포 확인**: `https://artlog.site` 접속 → 로그인 → 노트 생성까지 동작 확인.
   - 콘솔에 CORS 에러가 보이면 `FRONTEND_BASE_URL`(백엔드) 점검.
   - 로그인 직후엔 되는데 새로고침하면 풀리면 refresh 쿠키 `SameSite` 점검.

> **프리뷰 배포(PR 미리보기)**: `*-git-*.vercel.app` 등 동적 도메인은 백엔드 CORS(`FRONTEND_BASE_URL` 단일 origin)에 안 걸려 API 호출이 막힙니다. 프리뷰에서 백엔드까지 붙이려면 CORS 를 다중 origin/패턴 허용으로 확장해야 합니다(현재는 운영 도메인 1개만 허용).
