# RAG_README

Artlog의 RAG(Retrieval-Augmented Generation) 기반 성장 리포트 기능의 구조와 구현 내용을 정리합니다.
RAG 관련 기능이 변경될 때마다 이 파일을 업데이트합니다.

---

## 개요

레슨노트가 생성될 때마다 핵심 피드백을 벡터 DB에 저장합니다.
누적 레슨노트가 3개 이상이 되면, 새 레슨노트 생성 시 과거 피드백과 비교해 **성장한 점과 반복 지적 사항**을 5줄 내외의 성장 리포트로 작성합니다.

---

## 아키텍처

```
레슨노트 생성 완료
      ↓
[embed_note_node]
  key_feedback, feedback_card, practice_guide 항목을 임베딩
  → pgvector (lesson_note_embedding 테이블) 저장
      ↓
[generate_growth_report_node]
  누적 레슨노트 수 확인 (< 3개면 스킵)
  현재 피드백 임베딩으로 유사 과거 피드백 코사인 유사도 검색
  → GPT로 5줄 성장 리포트 생성
      ↓
Spring이 growth_report를 Note 엔티티에 저장
      ↓
레슨노트 상세 API 응답에 growthReport 포함
```

---

## LangGraph 파이프라인

현재 파이프라인 (7단계):

```
stt → correction → feedback_analysis → lesson_note → review_lesson_note → embed_note → growth_report
                                              ↑               |
                                              └── 재생성 루프 ─┘
```

| 노드 | 역할 |
|------|------|
| `stt` | STT (gpt-4o-transcribe-diarize) |
| `correction` | 텍스트 보정 (Tavily 가사 검색 포함) |
| `feedback_analysis` | 선생님 피드백 심층 분석 |
| `lesson_note` | 최종 레슨노트 생성 |
| `review_lesson_note` | 섹션 중복 검토 → 필요 시 재생성 |
| `embed_note` | **[신규]** 레슨노트 임베딩 → pgvector 저장 |
| `growth_report` | **[신규]** 유사 피드백 검색 → 성장 리포트 생성 |

---

## 벡터 DB 스키마

**테이블: `lesson_note_embedding`** (public 스키마)

```sql
CREATE TABLE lesson_note_embedding (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    note_id      BIGINT NOT NULL,
    content_type VARCHAR(50) NOT NULL,   -- 'key_feedback' | 'feedback_card' | 'practice_guide'
    content      TEXT NOT NULL,
    embedding    vector(1536),           -- text-embedding-3-small
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 벡터 유사도 검색 인덱스
CREATE INDEX idx_lesson_note_embedding_vec
ON lesson_note_embedding USING ivfflat (embedding vector_cosine_ops);

-- 사용자/노트 필터링 인덱스
CREATE INDEX idx_lesson_note_embedding_user_note
ON lesson_note_embedding (user_id, note_id);
```

**임베딩 모델:** `text-embedding-3-small` (OpenAI, 1536차원)

**임베딩 대상 항목:**

| content_type | 소스 | 예시 형식 |
|---|---|---|
| `key_feedback` | `lesson_note.key_feedback` | `"제목: 내용"` |
| `feedback_card` | `lesson_note.feedback_card` | `"[keyword_id] 제목: 내용"` |
| `practice_guide` | `lesson_note.practice_guide` | `"제목: 내용"` |

---

## 핵심 파일 목록

### AI 서비스 (FastAPI)

| 파일 | 역할 |
|------|------|
| [ai/app/services/embedding_store.py](ai/app/services/embedding_store.py) | pgvector 연동 핵심 클래스. setup/embed_and_store/search_similar |
| [ai/app/graph/nodes/growth_report_agent.py](ai/app/graph/nodes/growth_report_agent.py) | `aembed_note_node`, `agenerate_growth_report_node` 구현 |
| [ai/app/graph/workflow.py](ai/app/graph/workflow.py) | 파이프라인에 embed_note, growth_report 노드 연결 |
| [ai/app/graph/state.py](ai/app/graph/state.py) | `user_id`, `note_id`, `growth_report` 필드 포함 |
| [ai/app/schema/models.py](ai/app/schema/models.py) | 요청에 `user_id`/`note_id`, 응답에 `growth_report` 포함 |
| [ai/app/main.py](ai/app/main.py) | lifespan에서 EmbeddingStore 초기화 및 풀 주입 |

### Spring 백엔드

| 파일 | 역할 |
|------|------|
| [back/.../entity/Note.java](back/src/main/java/com/artlog/domain/note/entity/Note.java) | `growthReport` TEXT 컬럼 추가 |
| [back/.../service/LessonNoteProcessingService.java](back/src/main/java/com/artlog/domain/note/service/LessonNoteProcessingService.java) | `user_id`/`note_id` 요청 전달, `growth_report` 파싱/저장 |
| [back/.../dto/NoteResponse.java](back/src/main/java/com/artlog/domain/note/dto/NoteResponse.java) | `NoteDetail`에 `growthReport` 필드 추가 |
| [back/.../service/LessonNoteEventService.java](back/src/main/java/com/artlog/domain/note/service/LessonNoteEventService.java) | `embed_note`(88%), `growth_report`(95%) 진행 단계 추가 |

---

## 진행률 단계 (LessonNoteEventService)

| stage | progress | 메시지 |
|-------|----------|--------|
| queued | 5% | 레슨노트를 준비하고 있어요. |
| stt | 15% | 녹음본을 이해하고 있어요. |
| correction | 30% | 레슨 내용을 정리하고 있어요. |
| feedback_analysis | 50% | 선생님의 피드백을 살펴보고 있어요. |
| lesson_note | 65% | 연습에 도움이 되도록 노트를 만들고 있어요. |
| review_lesson_note | 80% | 노트 내용을 한 번 더 확인하고 있어요. |
| embed_note | 88% | 레슨 기록을 저장하고 있어요. |
| growth_report | 95% | 성장 리포트를 작성하고 있어요. |
| completed | 100% | 레슨노트가 준비됐어요. |

---

## 성장 리포트 생성 조건

- 해당 사용자의 `lesson_note_embedding`에 저장된 **distinct note_id 수 ≥ 3**
- `embed_note_node`가 먼저 실행되어 현재 노트가 저장된 이후 카운트하므로 현재 노트 포함 기준

조건 미충족 시 `growth_report = null`로 저장되며 API 응답에도 `null`로 반환됩니다.
프론트엔드에서는 `growthReport`가 `null`이면 해당 섹션을 숨기면 됩니다.

---

## 배포 시 주의사항

Railway PostgreSQL에서 pgvector 확장을 수동으로 활성화해야 합니다 (슈퍼유저 권한 필요):

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

테이블과 인덱스는 FastAPI 앱 시작 시 `EmbeddingStore.setup()`이 자동으로 생성합니다.

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-12 | 최초 구현: pgvector 기반 레슨노트 임베딩 저장 및 성장 리포트 생성 파이프라인 |
