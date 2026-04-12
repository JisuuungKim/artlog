"""
embedding_store.py — 레슨노트 임베딩 저장/조회

pgvector 테이블(lesson_note_embedding)을 직접 관리합니다.
앱 시작 시 setup()으로 테이블과 인덱스를 생성하고,
embed_and_store()로 레슨노트 항목을 임베딩해 저장합니다.

content_type 종류:
  - key_feedback      : 핵심 피드백 (지적 사항)
  - feedback_card     : 카테고리별 피드백
  - practice_guide    : 연습 방법
  - improvement_noted : 선생님이 명시적으로 인정한 개선/칭찬 발화
"""

import logging
from datetime import datetime, timezone
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
    category_id  BIGINT,
    folder_id    BIGINT,
    content_type VARCHAR(50) NOT NULL,
    content      TEXT NOT NULL,
    embedding    vector(1536),
    created_at   TIMESTAMPTZ DEFAULT NOW()
)
"""

ALTER_TABLE_SQLS = [
    "ALTER TABLE lesson_note_embedding ADD COLUMN IF NOT EXISTS category_id BIGINT",
    "ALTER TABLE lesson_note_embedding ADD COLUMN IF NOT EXISTS folder_id BIGINT",
]

CREATE_INDEX_EMBEDDING_SQL = """
CREATE INDEX IF NOT EXISTS idx_lesson_note_embedding_vec
ON lesson_note_embedding
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10)
"""

CREATE_INDEX_USER_SQL = """
CREATE INDEX IF NOT EXISTS idx_lesson_note_embedding_user_note
ON lesson_note_embedding (user_id, category_id, folder_id, note_id)
"""

INSERT_SQL = """
INSERT INTO lesson_note_embedding (
    user_id,
    note_id,
    category_id,
    folder_id,
    content_type,
    content,
    embedding
)
VALUES (%s, %s, %s, %s, %s, %s, %s::vector)
"""

DELETE_NOTE_SQL = """
DELETE FROM lesson_note_embedding
WHERE user_id = %s AND note_id = %s
"""

COUNT_NOTES_SQL = """
SELECT COUNT(DISTINCT note_id)
FROM lesson_note_embedding
WHERE user_id = %s
  AND (%s::BIGINT IS NULL OR category_id = %s)
  AND (%s::BIGINT IS NULL OR folder_id = %s)
"""

# 시계열 구성용: note_id, created_at 포함하여 반환
SEARCH_TIMELINE_SQL = """
SELECT
    note_id,
    content_type,
    content,
    1 - (embedding <=> %s::vector) AS similarity,
    created_at
FROM lesson_note_embedding
WHERE user_id = %s
  AND note_id != %s
  AND (%s::BIGINT IS NULL OR category_id = %s)
  AND (%s::BIGINT IS NULL OR folder_id = %s)
  AND content_type != 'improvement_noted'
ORDER BY embedding <=> %s::vector
LIMIT %s
"""

# 최근 레슨 컨텍스트용: 새 메타데이터 없이 기존 created_at으로 최근 note를 찾습니다.
SEARCH_RECENT_NOTES_SQL = """
WITH recent_notes AS (
    SELECT
        note_id,
        MAX(created_at) AS note_created_at
    FROM lesson_note_embedding
    WHERE user_id = %s
      AND note_id != %s
      AND (%s::BIGINT IS NULL OR category_id = %s)
      AND (%s::BIGINT IS NULL OR folder_id = %s)
    GROUP BY note_id
    ORDER BY MAX(created_at) DESC
    LIMIT %s
)
SELECT
    e.note_id,
    e.content_type,
    e.content,
    e.created_at,
    recent_notes.note_created_at
FROM lesson_note_embedding e
JOIN recent_notes ON recent_notes.note_id = e.note_id
WHERE e.user_id = %s
  AND (%s::BIGINT IS NULL OR e.category_id = %s)
  AND (%s::BIGINT IS NULL OR e.folder_id = %s)
  AND e.content_type != 'improvement_noted'
ORDER BY
    recent_notes.note_created_at ASC,
    CASE e.content_type
        WHEN 'key_feedback' THEN 1
        WHEN 'feedback_card' THEN 2
        WHEN 'practice_guide' THEN 3
        ELSE 4
    END,
    e.created_at ASC
"""

# improvement_noted 전용 검색
SEARCH_IMPROVEMENT_SQL = """
SELECT
    note_id,
    content,
    1 - (embedding <=> %s::vector) AS similarity,
    created_at
FROM lesson_note_embedding
WHERE user_id = %s
  AND note_id != %s
  AND (%s::BIGINT IS NULL OR category_id = %s)
  AND (%s::BIGINT IS NULL OR folder_id = %s)
  AND content_type = 'improvement_noted'
ORDER BY embedding <=> %s::vector
LIMIT %s
"""


def _to_vector_literal(values: list[float]) -> str:
    return "[" + ",".join(str(value) for value in values) + "]"


def _recency_score(created_at: datetime | None) -> float:
    """기존 created_at만 사용해 최근 레슨에 작은 가중치를 줍니다."""
    if created_at is None:
        return 0.0
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    days = max((datetime.now(timezone.utc) - created_at).days, 0)
    return 1 / (1 + days / 30)


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
            for sql in ALTER_TABLE_SQLS:
                await conn.execute(sql)
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
        category_id: int | None,
        folder_id: int | None,
        lesson_note: dict,
        improvements_noted: list[str] | None = None,
    ) -> None:
        """
        레슨노트의 key_feedback, feedback_card, practice_guide와
        선생님 명시 개선 발화(improvement_noted)를 임베딩해 저장합니다.
        """
        if user_id is None or note_id is None:
            raise ValueError("user_id와 note_id는 임베딩 저장에 필수입니다.")

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

        for text in (improvements_noted or []):
            if text.strip():
                items.append(("improvement_noted", text.strip()))

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
            (
                user_id,
                note_id,
                category_id,
                folder_id,
                content_type,
                text,
                _to_vector_literal(embedding_obj.embedding),
            )
            for (content_type, text), embedding_obj in zip(items, response.data)
        ]

        async with self._pool.connection() as conn:
            await conn.execute(DELETE_NOTE_SQL, (user_id, note_id))
            async with conn.cursor() as cur:
                await cur.executemany(INSERT_SQL, rows)

        improvement_count = len([i for i in items if i[0] == "improvement_noted"])
        logger.info(
            "embed_and_store 완료: user_id=%d, note_id=%d, 항목수=%d (improvement_noted=%d)",
            user_id, note_id, len(rows), improvement_count,
        )

    async def count_distinct_notes(
        self,
        user_id: int,
        category_id: int | None = None,
        folder_id: int | None = None,
    ) -> int:
        """해당 사용자의 임베딩이 저장된 레슨노트 수를 반환합니다."""
        async with self._pool.connection() as conn:
            cursor = await conn.execute(
                COUNT_NOTES_SQL,
                (user_id, category_id, category_id, folder_id, folder_id),
            )
            row = await cursor.fetchone()
            return row[0] if row else 0

    async def search_similar_with_timeline(
        self,
        user_id: int,
        exclude_note_id: int,
        category_id: int | None,
        folder_id: int | None,
        query_texts: list[str],
        limit: int = 20,
    ) -> list[dict]:
        """
        현재 피드백과 유사한 과거 피드백을 검색하고 note_id + created_at을 포함해 반환합니다.
        반환값을 note_id 기준으로 그룹화하면 토픽별 시계열을 구성할 수 있습니다.

        반환 형식: [{"note_id": ..., "content_type": ..., "content": ..., "similarity": ..., "created_at": ...}]
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

        candidate_limit = max(limit * 3, limit)

        async with self._pool.connection() as conn:
            for embedding_obj in response.data:
                vec = _to_vector_literal(embedding_obj.embedding)
                cursor = await conn.execute(
                    SEARCH_TIMELINE_SQL,
                    (
                        vec,
                        user_id,
                        exclude_note_id,
                        category_id,
                        category_id,
                        folder_id,
                        folder_id,
                        vec,
                        candidate_limit,
                    ),
                )
                rows = await cursor.fetchall()
                for row in rows:
                    content = row[2]
                    if content not in seen:
                        seen.add(content)
                        similarity = float(row[3])
                        results.append({
                            "note_id": row[0],
                            "content_type": row[1],
                            "content": content,
                            "similarity": similarity,
                            "created_at": row[4],
                            "rank_score": similarity * 0.8 + _recency_score(row[4]) * 0.2,
                        })

        results.sort(key=lambda x: x["rank_score"], reverse=True)
        return results[:limit]

    async def search_recent_note_context(
        self,
        user_id: int,
        exclude_note_id: int,
        category_id: int | None,
        folder_id: int | None,
        note_limit: int = 2,
        content_limit_per_note: int = 6,
    ) -> list[dict]:
        """
        가장 최근 과거 레슨의 내용을 가져옵니다.
        최근 컨텍스트는 RAG가 놓칠 수 있는 가까운 수업 흐름을 보완하는 용도로만 씁니다.
        """
        rows_by_note: dict[int, dict] = {}

        async with self._pool.connection() as conn:
            cursor = await conn.execute(
                SEARCH_RECENT_NOTES_SQL,
                (
                    user_id,
                    exclude_note_id,
                    category_id,
                    category_id,
                    folder_id,
                    folder_id,
                    note_limit,
                    user_id,
                    category_id,
                    category_id,
                    folder_id,
                    folder_id,
                ),
            )
            rows = await cursor.fetchall()

        for row in rows:
            note_id = row[0]
            if note_id not in rows_by_note:
                rows_by_note[note_id] = {
                    "note_id": note_id,
                    "created_at": row[4],
                    "contents": [],
                }
            if len(rows_by_note[note_id]["contents"]) < content_limit_per_note:
                rows_by_note[note_id]["contents"].append({
                    "content_type": row[1],
                    "content": row[2],
                    "created_at": row[3],
                })

        return sorted(
            rows_by_note.values(),
            key=lambda x: x["created_at"],
        )

    async def search_improvement_noted(
        self,
        user_id: int,
        exclude_note_id: int,
        category_id: int | None,
        folder_id: int | None,
        query_texts: list[str],
        limit: int = 10,
    ) -> list[dict]:
        """
        현재 피드백 주제와 유사한 과거 improvement_noted(선생님 명시 칭찬)를 검색합니다.
        반환 형식: [{"note_id": ..., "content": ..., "similarity": ..., "created_at": ...}]
        """
        if not query_texts:
            return []

        try:
            response = await self._openai.embeddings.create(
                model=EMBEDDING_MODEL,
                input=query_texts,
            )
        except Exception as e:
            logger.error("improvement 검색용 임베딩 생성 실패: %s", e)
            raise

        seen: set[str] = set()
        results: list[dict] = []

        async with self._pool.connection() as conn:
            for embedding_obj in response.data:
                vec = _to_vector_literal(embedding_obj.embedding)
                cursor = await conn.execute(
                    SEARCH_IMPROVEMENT_SQL,
                    (
                        vec,
                        user_id,
                        exclude_note_id,
                        category_id,
                        category_id,
                        folder_id,
                        folder_id,
                        vec,
                        limit,
                    ),
                )
                rows = await cursor.fetchall()
                for row in rows:
                    content = row[1]
                    if content not in seen:
                        seen.add(content)
                        results.append({
                            "note_id": row[0],
                            "content": content,
                            "similarity": float(row[2]),
                            "created_at": row[3],
                        })

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:limit]
