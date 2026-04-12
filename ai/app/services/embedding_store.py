"""
embedding_store.py — 레슨노트 임베딩 저장/조회

pgvector 테이블(lesson_note_embedding)을 직접 관리합니다.
앱 시작 시 setup()으로 테이블과 인덱스를 생성하고,
embed_and_store()로 레슨노트 항목을 임베딩해 저장합니다.
search_similar()로 유사 피드백을 코사인 유사도 기준으로 조회합니다.
"""

import logging
from typing import Optional

import psycopg
from openai import AsyncOpenAI
from psycopg_pool import AsyncConnectionPool

logger = logging.getLogger(__name__)

# main.py lifespan에서 주입되는 싱글턴 인스턴스
_store: Optional["EmbeddingStore"] = None

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536

CREATE_EXTENSION_SQL = "CREATE EXTENSION IF NOT EXISTS vector"

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS lesson_note_embedding (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    note_id      BIGINT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content      TEXT NOT NULL,
    embedding    vector(1536),
    created_at   TIMESTAMPTZ DEFAULT NOW()
)
"""

CREATE_INDEX_EMBEDDING_SQL = """
CREATE INDEX IF NOT EXISTS idx_lesson_note_embedding_vec
ON lesson_note_embedding
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10)
"""

CREATE_INDEX_USER_SQL = """
CREATE INDEX IF NOT EXISTS idx_lesson_note_embedding_user_note
ON lesson_note_embedding (user_id, note_id)
"""

INSERT_SQL = """
INSERT INTO lesson_note_embedding (user_id, note_id, content_type, content, embedding)
VALUES ($1, $2, $3, $4, $5::vector)
"""

COUNT_NOTES_SQL = """
SELECT COUNT(DISTINCT note_id)
FROM lesson_note_embedding
WHERE user_id = $1
"""

SEARCH_SQL = """
SELECT content_type, content, 1 - (embedding <=> $1::vector) AS similarity
FROM lesson_note_embedding
WHERE user_id = $2
  AND note_id != $3
ORDER BY embedding <=> $1::vector
LIMIT $4
"""


class EmbeddingStore:
    def __init__(self, pool: AsyncConnectionPool, openai_client: AsyncOpenAI):
        self._pool = pool
        self._openai = openai_client

    async def setup(self) -> None:
        """pgvector 확장, 테이블, 인덱스를 초기화합니다. 앱 시작 시 한 번만 호출."""
        dsn = self._pool.conninfo
        async with await psycopg.AsyncConnection.connect(dsn, autocommit=True) as conn:
            await conn.execute(CREATE_EXTENSION_SQL)
            await conn.execute(CREATE_TABLE_SQL)
            # ivfflat 인덱스는 데이터가 없으면 생성 시 lists 값 검증이 다를 수 있으므로
            # 에러를 무시하고 나중에 재시도해도 무방
            try:
                await conn.execute(CREATE_INDEX_EMBEDDING_SQL)
            except Exception as e:
                logger.warning("ivfflat 인덱스 생성 실패 (무시): %s", e)
            await conn.execute(CREATE_INDEX_USER_SQL)
        logger.info("EmbeddingStore setup complete.")

    async def embed_and_store(
        self,
        user_id: int,
        note_id: int,
        lesson_note: dict,
    ) -> None:
        """레슨노트의 key_feedback, feedback_card, practice_guide를 임베딩해 저장합니다."""
        items: list[tuple[str, str]] = []

        for item in lesson_note.get("key_feedback", []):
            text = f"{item.get('title', '')}: {item.get('content', '')}"
            items.append(("key_feedback", text.strip()))

        for card in lesson_note.get("feedback_card", []):
            kw_id = card.get("feedback_keyword_id", "")
            text = f"[{kw_id}] {card.get('title', '')}: {card.get('content', '')}"
            items.append(("feedback_card", text.strip()))

        for item in lesson_note.get("practice_guide", []):
            text = f"{item.get('title', '')}: {item.get('content', '')}"
            items.append(("practice_guide", text.strip()))

        if not items:
            logger.warning("embed_and_store: 임베딩할 항목이 없습니다. note_id=%d", note_id)
            return

        texts = [text for _, text in items]
        try:
            response = await self._openai.embeddings.create(
                model=EMBEDDING_MODEL,
                input=texts,
            )
        except Exception as e:
            logger.error("임베딩 생성 실패: %s", e)
            raise

        rows = [
            (user_id, note_id, content_type, text, embedding_obj.embedding)
            for (content_type, text), embedding_obj in zip(items, response.data)
        ]

        async with self._pool.connection() as conn:
            await conn.executemany(INSERT_SQL, rows)

        logger.info(
            "embed_and_store 완료: user_id=%d, note_id=%d, 항목수=%d",
            user_id, note_id, len(rows),
        )

    async def count_distinct_notes(self, user_id: int) -> int:
        """해당 사용자의 임베딩이 저장된 레슨노트 수를 반환합니다."""
        async with self._pool.connection() as conn:
            row = await conn.fetchone(COUNT_NOTES_SQL, (user_id,))
            return row[0] if row else 0

    async def search_similar(
        self,
        user_id: int,
        exclude_note_id: int,
        query_texts: list[str],
        limit: int = 15,
    ) -> list[dict]:
        """
        query_texts 각각에 대해 유사 피드백을 검색하고 중복 제거 후 반환합니다.
        반환 형식: [{"content_type": ..., "content": ..., "similarity": ...}]
        """
        if not query_texts:
            return []

        try:
            response = await self._openai.embeddings.create(
                model=EMBEDDING_MODEL,
                input=query_texts,
            )
        except Exception as e:
            logger.error("검색용 임베딩 생성 실패: %s", e)
            raise

        seen: set[str] = set()
        results: list[dict] = []

        async with self._pool.connection() as conn:
            for embedding_obj in response.data:
                vec = embedding_obj.embedding
                rows = await conn.fetchall(SEARCH_SQL, (vec, user_id, exclude_note_id, limit))
                for row in rows:
                    content = row[1]
                    if content not in seen:
                        seen.add(content)
                        results.append({
                            "content_type": row[0],
                            "content": content,
                            "similarity": float(row[2]),
                        })

        # 유사도 내림차순 정렬 후 상위 limit개 반환
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:limit]
