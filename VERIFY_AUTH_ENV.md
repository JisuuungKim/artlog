# Auth Validation Environment

이 문서는 `Spring Boot + Redis + React(Vite)` 조합으로 소셜 로그인/토큰 재발급을 실제로 검증할 수 있는 로컬 환경을 맞추는 절차입니다.

## 1. 준비 파일

```bash
cp back/.env.example back/.env
cp front/.env.example front/.env
```

`back/.env` 에서 최소한 아래 값은 채워야 합니다.

- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`
- `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`

로컬 HTTP 검증 기준으로 기본값은 이미 맞춰져 있습니다.

- `FRONTEND_BASE_URL=http://localhost:5173`
- `OAUTH2_AUTHORIZED_REDIRECT_URI=http://localhost:5173/auth/callback`
- `OAUTH2_FAILURE_REDIRECT_URI=http://localhost:5173/auth/login`
- `REFRESH_COOKIE_SECURE=false`

## 2. OAuth Redirect URI 등록

각 provider 콘솔에 아래 백엔드 콜백 URL을 등록해야 합니다.

- Google: `http://localhost:8080/login/oauth2/code/google`
- Kakao: `http://localhost:8080/login/oauth2/code/kakao`
- Apple: `http://localhost:8080/login/oauth2/code/apple`

프론트 콜백 URL은 백엔드 env에만 사용됩니다.

- `http://localhost:5173/auth/callback`

## 3. 실행

```bash
docker compose up --build
```

실행 후 접근 주소:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`

## 4. 검증 순서

1. `http://localhost:5173/auth/login` 접속
2. Google/Kakao/Apple 버튼으로 로그인
3. 로그인 성공 후 `accessToken` 이 프론트에 저장되고 `/api/users/me` 호출 성공 확인
4. 브라우저 개발자도구에서 `refresh_token` 쿠키가 `HttpOnly` 로 저장됐는지 확인
5. Access Token 을 지우거나 만료시킨 뒤 보호 API 호출
6. `/api/auth/reissue` 가 1회만 호출되고 원 요청이 재시도되는지 확인
7. 로그아웃 후 `queryClient.clear()` 반영, `refresh_token` 쿠키 삭제, `/api/users/me` 401 확인

## 5. 확인 포인트

- Access Token: JS 저장소 사용
- Refresh Token: HttpOnly 쿠키 사용
- Refresh Token Rotation: `/api/auth/reissue` 호출 시 Redis 값이 새 토큰으로 교체
- Logout: Redis 세션 삭제 + 쿠키 만료
- Race Condition 방지: 동시 401 발생 시 재발급 요청은 단일 promise 로 합쳐짐

## 6. 참고

현재 검증 환경은 Docker 기준입니다. 로컬 Java/Node 설치가 없어도 `docker compose up --build` 로 검증 가능하게 맞췄습니다.
