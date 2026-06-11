# RAG_README

Artlog의 RAG(Retrieval-Augmented Generation) 기반 성장 리포트 기능의 구조와 구현 내용을 정리합니다.
RAG 관련 기능이 변경될 때마다 이 파일을 업데이트합니다.

---

## 개요

레슨노트가 생성될 때마다 핵심 피드백을 벡터 DB에 저장합니다.
누적 레슨노트가 3개 이상이 되면, 새 레슨노트 생성 시 과거 피드백과 비교해 **성장한 점과 반복 지적 사항**을 5줄 내외의 성장 리포트로 작성합니다.

---

## 설계 고민 기록

### 고민 1: 유사도 검색만으로 성장을 감지할 수 있나?

**문제 인식**

초기 구현은 현재 피드백을 임베딩해 유사한 과거 피드백을 검색하는 방식이었다. 그런데 유사도 검색은 **"같은 것을 찾는 도구"** 이므로, 반복 지적은 잘 찾지만 성장은 감지하지 못한다는 한계가 있었다. "과거에 없어졌으니 나아졌다"는 추론도 틀리다 — 그 레슨에서 해당 곡을 안 불렀거나, 선생님이 다른 부분에 집중했을 수도 있다.

**결론**

성장 감지를 벡터 검색에 맡기면 안 된다. 벡터 검색의 올바른 역할은 **"비교할 올바른 과거 피드백을 효율적으로 가져오는 것"** 이고, **"그게 성장인지 판단"** 은 LLM이 해야 한다.

---

### 고민 2: 그러면 "성장"을 진짜로 알 수 있는 신호는?

**두 가지 신호로 분리**

| 신호 | 신뢰도 | 방법 |
|------|--------|------|
| 선생님 명시 칭찬 | 높음 | transcript에서 "지난번보다 나아졌어요" 류 발화 직접 추출 |
| 시계열 방향 변화 | 중간 | 같은 주제 피드백이 여러 레슨에 걸쳐 어떻게 변했는지 LLM이 해석 |
| 피드백 부재 | 낮음 (사용 안 함) | 과거에 있었는데 이번엔 없는 것 — 성장이 아닐 수 있어 제외 |

**반복 지적 감지는 벡터 검색으로 충분히 효과적** — 유사도 높은 과거 피드백이 여러 note_id에서 반복 등장하면 반복 지적으로 표현.

---

### 고민 3: 검색 쿼리를 어떻게 설계해야 하나?

기존: 현재 피드백 임베딩 → 유사한 과거 피드백 검색 → 단순 유사도 결과를 LLM에 전달

개선:
- **검색 쿼리는 동일** (현재 key_feedback 텍스트)
- **반환값에 `note_id` + `created_at` 추가** → 같은 주제의 피드백을 note_id 기준으로 그룹화해 시계열로 구성
- **`improvement_noted` 전용 검색 추가** → 선생님 명시 칭찬과 관련된 과거 기록 별도 검색
- **LLM 프롬프트를 엄격하게** → 명시 칭찬이 없거나 시계열 방향이 불분명하면 성장으로 쓰지 못하도록 제어
- **유사 피드백 차이 분석** → 과거 유사 피드백을 현재 피드백과 비교해 문제 위치, 강도, 과제 구체성, 반복 여부가 어떻게 달라졌는지 먼저 분석하도록 제어
- **검색 범위를 명확하게 제한** → 같은 `user_id`, `category_id`, `folder_id` 범위 안에서만 과거 피드백을 검색해 사용자/수업 맥락이 섞이지 않게 함
- **최근 레슨 컨텍스트 보강** → 새 메타데이터를 추가하지 않고 기존 `created_at` 기준 최근 과거 레슨 2개의 핵심 내용을 함께 전달해 가까운 수업 흐름을 반영
- **유사도 + 최근성 혼합 랭킹** → 유사 피드백 검색 결과를 `similarity 80% + 기존 created_at 기반 최근성 20%`로 정렬해 오래된 유사 피드백만 과도하게 선택되지 않도록 조정

---

## 구현 내용

### LangGraph 파이프라인 (8단계)

```
stt → correction → feedback_analysis → lesson_note → review_lesson_note
    → extract_improvement → embed_note → growth_report
                                ↑               |
                        재생성 루프 ─────────────┘
```

| 노드 | 역할 |
|------|------|
| `stt` | STT |
| `correction` | 텍스트 보정 |
| `feedback_analysis` | 선생님 피드백 심층 분석 |
| `lesson_note` | 최종 레슨노트 생성 |
| `review_lesson_note` | 섹션 중복 검토 → 필요 시 재생성 |
| `extract_improvement` | **[신규]** transcript에서 선생님 명시 칭찬/개선 인정 발화 추출 |
| `embed_note` | 레슨노트 피드백 + improvement_noted → pgvector 저장 |
| `growth_report` | 시계열 검색 + 칭찬 이력 검색 → 성장 리포트 생성 |

---

### 벡터 DB 스키마

**테이블: `lesson_note_embedding`** (public 스키마)

```sql
CREATE TABLE lesson_note_embedding (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    note_id      BIGINT NOT NULL,
    category_id  BIGINT,
    folder_id    BIGINT,
    content_type VARCHAR(50) NOT NULL,
    content      TEXT NOT NULL,
    embedding    vector(1536),           -- text-embedding-3-small
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lesson_note_embedding_vec
ON lesson_note_embedding USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_lesson_note_embedding_user_note
ON lesson_note_embedding (user_id, note_id);
```

**content_type 종류:**

| content_type | 소스 | 용도 |
|---|---|---|
| `key_feedback` | `lesson_note.key_feedback` | 반복 지적 / 시계열 구성 |
| `feedback_card` | `lesson_note.feedback_card` | 반복 지적 / 시계열 구성 |
| `practice_guide` | `lesson_note.practice_guide` | 반복 지적 / 시계열 구성 |
| `improvement_noted` | transcript 추출 | 성장 신호 (선생님 명시) |

---

### 검색 전략 (EmbeddingStore)

| 메서드 | 쿼리 | 반환 | 용도 |
|--------|------|------|------|
| `search_similar_with_timeline` | 현재 key_feedback 텍스트 | note_id + created_at 포함 | 토픽별 시계열 구성 |
| `search_recent_note_context` | 기존 created_at 기준 최근 note | 최근 과거 레슨별 content 목록 | 가까운 수업 흐름 보강 |
| `search_improvement_noted` | 현재 key_feedback 텍스트 | improvement_noted 항목만 | 선생님 명시 칭찬 이력 |

**시계열 구성 방식:** `search_similar_with_timeline` 결과를 `note_id`로 그룹화 → `created_at` 오름차순 정렬 → LLM이 피드백 흐름의 방향 변화를 해석

**최근 컨텍스트 방식:** 새 컬럼을 만들지 않고 `lesson_note_embedding.created_at`으로 최근 과거 레슨 2개를 가져옵니다. 최근 컨텍스트는 "직전 수업 흐름" 참고용이고, 성장 판단의 직접 근거는 유사 피드백 시계열과 선생님 명시 칭찬을 우선합니다.

---

### 성장 리포트 LLM 입력 구조

```
[오늘 레슨의 핵심 피드백]
- 고음 구간에서 호흡이 너무 일찍 소모됨: ...
- ...

[최근 과거 레슨 요약]
[최근 레슨 흐름 1 — 2026-03-01]
  · 호흡 길이는 나아졌지만 고음 전에 끊김

[토픽별 시계열 (과거 유사 피드백)]
[1번째 과거 레슨 — 2026-02-10]
  · 고음에서 숨이 너무 짧게 들어감 (유사도: 0.91)
[2번째 과거 레슨 — 2026-03-01]
  · 호흡 길이는 나아졌지만 고음 전에 끊김 (유사도: 0.87)

[선생님 명시 개선 인정 발화]
- "지난번보다 호흡이 훨씬 안정됐어요" (2026-03-15)
```

**LLM 프롬프트 핵심 제약:**
- 선생님 명시 칭찬이 없거나 시계열 방향이 불분명하면 성장으로 표현하지 않음
- 선생님 명시 칭찬이 없고 피드백이 단순히 사라진 경우 성장으로 쓰지 않음
- 반복 지적은 차이가 거의 없는 유사 피드백이 시계열에 2회 이상 등장할 때만 표현 가능
- 과거와 현재의 차이를 성장 리포트에 최소 1줄 포함

---

## 진행률 단계

| stage | progress | 메시지 |
|-------|----------|--------|
| queued | 5% | 레슨노트를 준비하고 있어요. |
| stt | 15% | 녹음본을 이해하고 있어요. |
| correction | 30% | 레슨 내용을 정리하고 있어요. |
| feedback_analysis | 50% | 선생님의 피드백을 살펴보고 있어요. |
| lesson_note | 65% | 연습에 도움이 되도록 노트를 만들고 있어요. |
| review_lesson_note | 80% | 노트 내용을 한 번 더 확인하고 있어요. |
| extract_improvement | 85% | 선생님의 칭찬을 찾고 있어요. |
| embed_note | 90% | 레슨 기록을 저장하고 있어요. |
| growth_report | 95% | 성장 리포트를 작성하고 있어요. |
| completed | 100% | 레슨노트가 준비됐어요. |

---

## 성장 리포트 생성 조건

- 같은 `user_id`, `category_id`, `folder_id` 범위의 `lesson_note_embedding`에 저장된 **distinct note_id 수 ≥ 3**
- `embed_note_node`가 먼저 실행되어 현재 노트가 저장된 이후 카운트하므로 현재 노트 포함 기준

조건 미충족 시 `growth_report = null`이며, 프론트엔드에서는 `null`이면 해당 섹션을 숨기면 됩니다.

---

## 핵심 파일 목록

### AI 서비스 (FastAPI)

| 파일 | 역할 |
|------|------|
| [ai/app/services/embedding_store.py](ai/app/services/embedding_store.py) | pgvector 연동. setup / embed_and_store / search_similar_with_timeline / search_recent_note_context / search_improvement_noted / note 단위 재저장 중복 방지 |
| [ai/app/graph/nodes/growth_report_agent.py](ai/app/graph/nodes/growth_report_agent.py) | `aextract_improvement_node`, `aembed_note_node`, `agenerate_growth_report_node` |
| [ai/app/graph/workflow.py](ai/app/graph/workflow.py) | 8단계 파이프라인 정의 |
| [ai/app/graph/state.py](ai/app/graph/state.py) | `user_id`, `note_id`, `improvements_noted`, `growth_report` 필드 |
| [ai/app/schema/models.py](ai/app/schema/models.py) | 요청에 `user_id`/`note_id`, 응답에 `growth_report` |
| [ai/app/main.py](ai/app/main.py) | lifespan에서 EmbeddingStore 초기화 및 풀 주입 |

### Spring 백엔드

| 파일 | 역할 |
|------|------|
| [back/.../entity/Note.java](back/src/main/java/com/artlog/domain/note/entity/Note.java) | `growthReport` TEXT 컬럼 |
| [back/.../service/LessonNoteProcessingService.java](back/src/main/java/com/artlog/domain/note/service/LessonNoteProcessingService.java) | `user_id`/`note_id`/`category_id`/`folder_id` 요청 전달, `growth_report` 파싱/저장 |
| [back/.../service/LessonNoteEmbeddingCleanupService.java](back/src/main/java/com/artlog/domain/note/service/LessonNoteEmbeddingCleanupService.java) | 노트 삭제 시 `lesson_note_embedding` 정리 |
| [back/.../dto/NoteResponse.java](back/src/main/java/com/artlog/domain/note/dto/NoteResponse.java) | `NoteDetail`에 `growthReport` 필드 |
| [back/.../service/LessonNoteEventService.java](back/src/main/java/com/artlog/domain/note/service/LessonNoteEventService.java) | `extract_improvement`(85%), `embed_note`(90%), `growth_report`(95%) 단계 |

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
| 2026-04-12 | 구조 개선: 단순 유사도 검색 → 시계열 기반 검색 + `improvement_noted` 분리 + `extract_improvement` 노드 추가 |
| 2026-04-12 | RAG 개선: 새 메타데이터 추가 없이 최근 레슨 컨텍스트와 유사도+최근성 혼합 랭킹 적용 |
