"""
artlog AI Agent Server
======================
FastAPI 애플리케이션 진입점.

lifespan 컨텍스트 매니저를 통해:
  - 앱 시작 시 AsyncConnectionPool, AsyncPostgresSaver, 워크플로우를 초기화
  - 앱 종료 시 커넥션 풀을 안전하게 닫습니다.
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.graph.workflow import create_pool, create_checkpointer, compile_workflow
from app.services.embedding_store import EmbeddingStore
import app.services.embedding_store as _embedding_store_module
from app.api.v1 import lesson_notes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()

# ── LangSmith 추적 설정 ────────────────────────────────────────────
# .env에 LANGSMITH_TRACING=true 와 LANGSMITH_API_KEY 를 입력하면 자동 활성화
os.environ["LANGSMITH_TRACING"] = settings.langsmith_tracing
os.environ["LANGCHAIN_TRACING_V2"] = settings.langsmith_tracing
os.environ["LANGSMITH_PROJECT"] = settings.langsmith_project
os.environ["LANGCHAIN_PROJECT"] = settings.langsmith_project
os.environ["LANGSMITH_ENDPOINT"] = settings.langsmith_endpoint
if settings.langsmith_api_key:
    os.environ["LANGSMITH_API_KEY"] = settings.langsmith_api_key
    os.environ["LANGCHAIN_API_KEY"] = settings.langsmith_api_key
if settings.openai_api_key:
    os.environ["OPENAI_API_KEY"] = settings.openai_api_key


# ────────────────────────────────────────────────────────────────
# 앱 생명주기 (Lifespan)
# ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan 컨텍스트.

    yield 이전: 리소스 초기화
    yield 이후: 리소스 정리
    """
    logger.info("Starting up AI Agent Server...")

    # 1. 비동기 커넥션 풀 생성
    pool = await create_pool()

    # 2. PostgresSaver 초기화 및 `ai_agent_schema` 내에 체크포인트 테이블 생성
    checkpointer = await create_checkpointer(pool)

    # 3. EmbeddingStore 초기화 (pgvector 테이블 생성 포함)
    openai_client = AsyncOpenAI(api_key=settings.openai_api_key or None)
    embedding_store = EmbeddingStore(pool=pool, openai_client=openai_client)
    await embedding_store.setup()
    # growth_report_agent.py에서 임포트해 쓸 수 있도록 모듈 변수에 주입
    _embedding_store_module._store = embedding_store

    # 4. 워크플로우 컴파일 (체크포인터 주입)
    workflow = compile_workflow(checkpointer)

    # 5. app.state 에 저장 → 라우터에서 request.app.state 로 접근
    app.state.pool = pool
    app.state.checkpointer = checkpointer
    app.state.embedding_store = embedding_store
    app.state.workflow = workflow

    logger.info("AI Agent Server is ready.")
    yield

    # 종료 시 커넥션 풀 닫기
    logger.info("Shutting down AI Agent Server...")
    await pool.close()
    logger.info("AsyncConnectionPool closed.")


# ────────────────────────────────────────────────────────────────
# FastAPI 앱 생성
# ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="artlog AI Agent Server",
    description="Spring Boot 메인 서버와 연동하는 LangGraph 기반 AI 에이전트 서버",
    version="0.1.0",
    lifespan=lifespan,
)

# ────────────────────────────────────────────────────────────────
# 라우터 등록
# ────────────────────────────────────────────────────────────────

app.include_router(
    lesson_notes.router,
    prefix="/api/v1/lesson-notes",
    tags=["Lesson Notes"],
)


# ────────────────────────────────────────────────────────────────
# 헬스체크
# ────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "artlog-ai-agent"}
