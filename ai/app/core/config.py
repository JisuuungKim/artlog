from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    .env 파일을 읽어 애플리케이션 전역 설정을 제공합니다.
    pydantic-settings 가 자동으로 환경 변수 / .env 를 파싱합니다.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── PostgreSQL ────────────────────────────────────────────────
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "artlog_db"
    postgres_user: str = "artlog_user"
    postgres_password: str = ""

    # ── LangGraph 체크포인트 스키마 ────────────────────────────────
    ai_schema: str = "ai_agent_schema"

    # ── LLM ───────────────────────────────────────────────────────
    openai_api_key: str = ""

    # ── 커넥션 풀 크기 ─────────────────────────────────────────────
    db_pool_min_size: int = 2
    db_pool_max_size: int = 10

    @property
    def async_db_url(self) -> str:
        """psycopg3 AsyncConnectionPool 용 DSN 문자열."""
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache
def get_settings() -> Settings:
    """싱글턴 Settings 인스턴스를 반환합니다."""
    return Settings()
