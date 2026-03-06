"""検索 → LLM回答（根拠引用つき）のチェーン."""
from openai import OpenAI
from rag.config import OPENAI_API_KEY, CHAT_MODEL, TOP_K
from rag.vectorstore import search
from rag.guardrails import mask_pii, detect_injection, filter_output
from rag.logger import log_event

_client = OpenAI(api_key=OPENAI_API_KEY)

SYSTEM_PROMPT = """\
あなたは社内ドキュメントに基づいて回答するアシスタントです。
ルール:
- 与えられた【参考文書】だけを根拠に回答してください。
- 回答の各文に [出典: ファイル名] を付けてください。
- 参考文書に答えがない場合は「ドキュメントに該当する情報が見つかりませんでした」と答えてください。
- 推測や外部知識で補完しないでください。
"""

def ask(query: str, top_k: int = TOP_K) -> dict:
    """Return {"answer": str, "hits": list[dict], "blocked": bool}."""

    # --- Input guardrails ---
    if detect_injection(query):
        log_event("blocked_injection", query=query)
        return {"answer": "⚠️ 不正な指示が検知されました。質問を修正してください。", "hits": [], "blocked": True}

    safe_query = mask_pii(query)

    # --- Retrieve ---
    hits = search(safe_query, top_k=top_k)

    # --- Build context ---
    context_parts = []
    for i, h in enumerate(hits, 1):
        context_parts.append(f"【参考文書{i}】(出典: {h['source']})\n{h['text']}")
    context = "\n\n".join(context_parts)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"【参考文書】\n{context}\n\n質問: {safe_query}"},
    ]

    # --- Generate ---
    resp = _client.chat.completions.create(model=CHAT_MODEL, messages=messages, temperature=0.2, max_tokens=1024)
    raw_answer = resp.choices[0].message.content or ""

    # --- Output guardrails ---
    answer = filter_output(raw_answer)

    # --- Audit log ---
    log_event(
        "qa",
        query=safe_query,
        model=CHAT_MODEL,
        top_k=top_k,
        sources=[h["source"] for h in hits],
        answer_length=len(answer),
    )

    return {"answer": answer, "hits": hits, "blocked": False}
