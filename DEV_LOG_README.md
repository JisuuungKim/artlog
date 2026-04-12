# DEV_LOG_README

이 문서는 Artlog를 개발하면서 어떤 흐름으로 만들었고, 어떤 문제를 발견했으며, 어떻게 개선했는지 짧게 남기는 개발 로그입니다. 앞으로 기능을 바꾸거나 구조를 개선할 때마다 이 파일에 핵심만 추가합니다.

작성할 때는 `왜 개선했는지 → 어떻게 개선했는지 → 어떤 효과가 있는지` 순서로 길지 않게 정리합니다.
"어떻게 개선했는지"를 제외하고는 전부 비즈니스적인 관점에서 작성합니다.

## 2026-04-11

### AI 레슨노트 처리 흐름 정리

레슨노트 업로드 이후의 전체 흐름을 확인했습니다. 프론트에서 오디오를 업로드하면 Spring Boot가 파일을 저장하고, 사용자가 메타데이터를 입력한 뒤 레슨노트를 생성하면 `Note`를 `PROCESSING` 상태로 저장합니다. 이후 Redis 큐에 `noteId`를 넣고, Spring 백그라운드 워커가 FastAPI AI 서버를 호출해 LangGraph 기반 AI 파이프라인을 실행하는 구조입니다.

정리한 흐름:

1. 프론트 오디오 업로드
2. Spring Boot 파일 저장
3. 프론트 메타데이터 입력 후 레슨노트 생성 요청
4. Spring Boot가 `PROCESSING` 노트 생성
5. Redis 큐에 `noteId` 등록
6. Spring 워커가 FastAPI AI 서버 호출
7. FastAPI가 STT, 보정, 피드백 분석, 레슨노트 생성을 수행
8. Spring Boot가 결과를 DB에 저장하고 `COMPLETED` 또는 `FAILED`로 상태 변경

### 문제로 본 점

- Spring 스케줄러가 1초마다 Redis 큐를 확인하는 방식이라 큐가 비어 있어도 계속 깨어나는 구조였습니다.
- 프론트도 React Query `refetchInterval`로 처리 중인 노트를 2초마다 조회하고 있었습니다.
- 진행률 UI는 실제 AI 진행 단계가 아니라 하드코딩된 값에 가까웠습니다.
- 긴 AI 작업은 큐로 분리되어 있었지만, 상태 전달 방식은 아직 폴링 중심이었습니다.

### 개선한 점

- Spring의 `@Scheduled` 기반 큐 폴링을 제거했습니다.
- Redis `blockingRightPop` 기반 워커로 바꿔, 작업이 들어올 때까지 워커가 대기하도록 했습니다.
- Spring Boot에 SSE 엔드포인트를 추가해 노트 처리 완료/실패 상태를 프론트에 push하도록 했습니다.
- 프론트의 React Query `refetchInterval` 폴링을 제거했습니다.
- 프론트는 `EventSource`로 SSE를 구독하고, `COMPLETED` 또는 `FAILED` 이벤트를 받으면 관련 React Query 캐시를 무효화하도록 변경했습니다.
- FastAPI의 AI Agent 단계 변화를 스트리밍 응답으로 보내고, Spring이 이를 받아 Redis에 최신 진행 상태를 저장한 뒤 프론트 SSE로 중계하도록 개선했습니다.
- 메인페이지는 진행률 `%`만 보여주고, 상세 화면은 `녹음본을 이해하고 있어요.`처럼 사용자가 이해하기 쉬운 단계 문장을 보여주도록 바꿨습니다.
- Docker Compose 환경에서 Spring 컨테이너가 FastAPI를 `localhost`로 호출하던 문제를 `ai` 서비스명 기반 호출로 수정했습니다.
- AI 호출 실패가 빈 레슨노트 완료처럼 저장되지 않도록 STT/레슨노트 생성 실패를 즉시 실패 이벤트로 전달하게 했고, SSE 엔드포인트 인증은 query token을 컨트롤러에서 직접 검증하도록 정리했습니다.
- 처리 중인 레슨노트 카드도 상세 화면으로 이동할 수 있게 했고, 신규 회원은 월 4회 생성 가능 횟수를 받고 `/me` 조회 및 생성 시점에 한 달 단위로 자동 갱신되도록 했습니다.
- AI 서버에서 LangSmith 추적을 `.env`로 켜고 끌 수 있게 `LANGSMITH_TRACING`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`, `LANGSMITH_ENDPOINT` 설정을 추가했습니다.
- 메인 화면에서 처리 중인 레슨노트의 X 버튼으로 생성 중인 노트를 취소 삭제할 수 있게 하고, 취소 시 월간 생성 가능 횟수를 되돌리도록 했습니다.
- FastAPI SSE 스트림이 중간에 끊길 때 LangGraph 작업이 `CancelledError`로 취소되는 상황을 정상적인 연결 종료로 분리해, STT 실패처럼 보이지 않도록 정리했습니다.
- Spring worker가 재시작되며 AI 스트림 결과를 받을 수 없게 된 레슨노트는 앱 기동 시 `FAILED`로 복구하고, 이전 Redis job이 다시 처리되지 않도록 상태 검사를 추가했습니다.

### STT 병렬 처리 개선

- 왜 개선했는지: 20분 단위 순차 STT 호출은 긴 레슨 녹음에서 첫 청크가 전체 처리 시간을 크게 잡아먹었습니다.
- 어떻게 개선했는지: 오디오를 5분 단위로 자르고 5초 overlap을 붙인 뒤, STT API 호출을 최대 3개씩 병렬 실행하고 결과를 청크 순서대로 병합했습니다.
- 어떤 효과가 있는지: 긴 녹음의 STT 대기 시간이 줄고, 청크 경계에서 문장이 잘리는 문제도 완화됩니다.

### 레슨노트 결과 저장 오류 수정

- 왜 개선했는지: AI는 레슨노트를 생성했지만 `feedback_card.note_id`가 비어 DB 저장이 롤백되어 프론트에 결과가 보이지 않았습니다.
- 어떻게 개선했는지: `FeedbackCard` 엔티티에 `Note` 관계를 추가하고, AI 결과 저장 시 feedback card에 note를 함께 연결했습니다.
- 어떤 효과가 있는지: AI가 생성한 피드백 카드가 DB에 정상 저장되어 완료된 레슨노트 상세 화면에서 결과를 조회할 수 있습니다.

### AppBar 아이콘 클릭 구조 정리

- 왜 개선했는지: 화면마다 AppBar 아이콘을 직접 버튼으로 감싸 클릭 처리가 흩어져 있었습니다.
- 어떻게 개선했는지: AppBar에 `leftIconClick`, `rightIconClick`, `rightSecondaryIconClick`, `notificationIconClick` props를 추가하고 기존 사용처를 이 방식으로 바꿨습니다.
- 어떤 효과가 있는지: 상단바 아이콘 클릭 방식이 일관돼 화면별 중복 코드가 줄고 유지보수가 쉬워졌습니다.

### 남겨둔 고민

- `EventSource`는 커스텀 헤더를 붙이기 어려워, 현재는 SSE 요청에 한해 access token을 query parameter로 전달합니다. 장기적으로는 쿠키 기반 인증이나 SSE 전용 토큰 전략을 검토할 수 있습니다.
- Redis List + blocking pop은 간단하지만, worker가 job을 꺼낸 뒤 서버가 죽으면 job 유실 가능성이 있습니다. 운영 안정성이 더 필요해지면 Redis Streams + Consumer Group 구조를 검토합니다.

### 한 줄 회고

긴 AI 작업은 요청-응답 흐름에 묶어두기보다 큐 기반 백그라운드 처리로 분리하고, 상태 변화는 폴링보다 이벤트 기반으로 전달하는 편이 이 프로젝트에 더 잘 맞는다고 판단했습니다.
