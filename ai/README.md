# artlog AI Agent Server

Spring Boot 메인 서버(`artlog/back`)와 연동하는 **LangGraph 기반 AI 에이전트 서버**입니다.

## 프로젝트 구조

```
ai/
├── .env.example          # 환경변수 템플릿
├── requirements.txt      # Python 의존성
├── README.md
└── app/
    ├── main.py           # FastAPI 앱 진입점 (lifespan)
    ├── core/
    │   └── config.py     # pydantic-settings 설정 (.env 로딩)
    ├── schema/
    │   └── models.py     # Request / Response Pydantic 모델
    ├── graph/
    │   ├── state.py      # TypedDict AgentState
    │   └── workflow.py   # LangGraph 3단계 워크플로우 + PostgresSaver
    └── api/
        └── v1/
            └── lesson_notes.py  # POST /api/v1/lesson-notes/generate
```

## 빠른 시작

### 1. 환경 설정

```bash
cd artlog/ai
cp .env.example .env
```

`.env` 파일을 열어 실제 값으로 채워주세요:

```dotenv
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=artlog_db
POSTGRES_USER=artlog_user
POSTGRES_PASSWORD=<실제 비밀번호>
OPENAI_API_KEY=<OpenAI API 키>
AI_SCHEMA=ai_agent_schema   # LangGraph 체크포인트용 스키마 (자동 생성됨)
```

> **참고**: Spring Boot docker-compose 기준 DB 기본값이 미리 채워져 있습니다.

### 2. 의존성 설치

```bash
# Python 3.11+ 권장
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. 서버 실행

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

서버가 처음 시작될 때 PostgreSQL에 **`ai_agent_schema`** 스키마 및 LangGraph 체크포인트 테이블이 **자동 생성**됩니다.

### 4. API 문서

서버 실행 후 브라우저에서 확인:

- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

---

## API 엔드포인트

### `POST /api/v1/lesson-notes/generate`

레슨 원본 텍스트를 분석·요약하여 구조화된 레슨노트 JSON을 반환합니다.

**Request Body:**

```json
{
  "user_id": "user-123",
  "session_id": "sess-abc",
  "raw_content": "오늘 레슨에서 배운 내용..."
}
```

**Response:**

```json
{
  "session_id": "sess-abc",
  "lesson_note": {
    "title": "레슨 노트",
    "key_points": ["핵심 포인트 1", "핵심 포인트 2"],
    "summary": "요약 내용...",
    "action_items": ["다음 레슨 전까지 복습"]
  }
}
```

> `session_id`를 동일하게 보내면 LangGraph의 체크포인트를 통해 **대화 맥락이 유지**됩니다.

### `GET /health`

헬스체크 엔드포인트.

---

## 데이터베이스 스키마 분리

| 스키마            | 용도                                    |
| ----------------- | --------------------------------------- |
| `public`          | Spring Boot JPA 엔티티 테이블 (기존)    |
| `ai_agent_schema` | LangGraph 체크포인트 테이블 (자동 생성) |

커넥션 풀의 `search_path` 를 `ai_agent_schema,public` 으로 설정하여 두 스키마를 안전하게 분리합니다.

---

## 노드 구현 가이드

`app/graph/workflow.py` 의 각 노드 함수에 LLM 호출 로직을 추가하세요:

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

llm = ChatOpenAI(model="gpt-4o-mini")

async def analyze_node(state: AgentState) -> dict:
    result = await llm.ainvoke([HumanMessage(content=state["raw_content"])])
    return {"analysis_result": result.content}
```
