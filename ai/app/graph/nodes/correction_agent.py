"""
correction_agent.py  —  Correction Agent Node

[구조]
1. 코드 레벨에서 state["song_title"]을 순회하며 Tavily로 가사를 직접 검색
2. 검색된 가사를 Context로 LLM에게 전달
3. LLM은 도구 없이 '교정'만 수행
"""

import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.graph.state import AgentState

logger = logging.getLogger(__name__)

# ── System Prompt ────────────────────────────────────────────────────
SYSTEM_PROMPT = """\
당신은 음악 레슨 텍스트의 오타를 교정하는 전문 에디터입니다.

[작업 절차]
1. **가사 보정**: [검색된 공식 가사 데이터]를 참고하여 transcript 내의 노래 구절 오타를 수정하고, 가사는 따옴표("")로 감싸서 구분하세요.
2. **오타 교정**: 텍스트의 맥락을 파악해 모든 오타를 바로잡으세요.
3. **출력**: 다른 부연 설명 없이 보정된 전체 텍스트만 최종 결과물로 출력하세요.
"""

# ── Lazy singleton LLM ──────────────────────────────────────────────
_llm = None


def _get_llm() -> ChatOpenAI:
    """첫 호출 시에만 LLM을 생성합니다 (lazy init)."""
    global _llm
    if _llm is None:
        settings = get_settings()
        _llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0,
            api_key=settings.openai_api_key or None,
        )
    return _llm


# ── 검색 도구 (코드 레벨에서 직접 호출) ──────────────────────────────
def _search_lyrics(song_titles: list[str]) -> str:
    """song_title 리스트를 순회하며 Tavily로 가사를 검색하고 결과를 취합합니다."""
    from langchain_community.tools.tavily_search import TavilySearchResults

    tool = TavilySearchResults(max_results=3)
    results_text = []

    for title in song_titles:
        query = f"{title} 공식 가사"
        logger.info("[correction_node] 가사 검색 — 쿼리: %s", query)
        try:
            results = tool.invoke(query)
            if isinstance(results, list):
                snippets = "\n".join(
                    r.get("content", "") for r in results if isinstance(r, dict)
                )
            else:
                snippets = str(results)
            results_text.append(f"### {title}\n{snippets}")
        except Exception as e:
            logger.warning("[correction_node] '%s' 가사 검색 실패: %s", title, e)
            results_text.append(f"### {title}\n(검색 실패)")

    return "\n\n".join(results_text)


# ────────────────────────────────────────────────────────────────────
# Node
# ────────────────────────────────────────────────────────────────────

def correction_node(state: AgentState) -> dict[str, Any]:
    """
    LangGraph 노드: STT 텍스트 청크(transcripts)를 순회하며 개별 보정합니다.

    - song_title 목록을 기반으로 Tavily를 코드 레벨에서 직접 호출해 가사를 수집
    - 수집된 가사를 Context로 LLM에게 전달하여 각 청크별 교정 수행
    """
    transcripts: list[str] = state.get("transcripts", [])
    song_titles: list[str] = state.get("song_title", [])

    logger.info("[correction_node] 보정 시작 — 곡: %s", song_titles)

    # 1. 코드 레벨에서 가사 검색
    lyrics_context = _search_lyrics(song_titles) if song_titles else "(곡 정보 없음)"

    # 2. LLM 호출 준비
    titles_str = ", ".join(song_titles) if song_titles else "알 수 없음"
    llm = _get_llm()
    corrected_transcripts = []

    # 3. 각 청크별 개별 보정
    for idx, chunk in enumerate(transcripts):
        logger.info("[correction_node] 청크 %d/%d 보정 중...", idx + 1, len(transcripts))
        user_message = (
            f"[보정 대상 곡 제목]\n{titles_str}\n\n"
            f"[검색된 공식 가사 데이터]\n{lyrics_context}\n\n"
            f"[보정할 STT 청크]\n{chunk}"
        )

        try:
            response = llm.invoke([
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=user_message),
            ])
            corrected = response.content
        except Exception as e:
            logger.error("[correction_node] 청크 %d LLM 호출 실패: %s", idx + 1, e)
            corrected = chunk  # 실패 시 원본 유지

        corrected_transcripts.append(corrected)

    logger.info("[correction_node] 총 %d개 청크 보정 완료", len(corrected_transcripts))
    return {"transcripts": corrected_transcripts}
