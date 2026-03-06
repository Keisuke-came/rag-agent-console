#!/usr/bin/env python3
"""Streamlit チャット UI — 引用表示 & 検索 Top-K デバッグ."""
import streamlit as st
from rag.chain import ask

st.set_page_config(page_title="RAG MVP", page_icon="📚", layout="wide")
st.title("📚 RAG ローカル MVP")

# --- Session state ---
if "messages" not in st.session_state:
    st.session_state.messages = []

# --- Chat history ---
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if msg.get("hits"):
            with st.expander("🔍 検索 Top-K（デバッグ）"):
                for i, h in enumerate(msg["hits"], 1):
                    st.markdown(
                        f"**#{i}** `{h['source']}` (chunk {h['chunk_index']}, dist={h['distance']:.4f})\n\n"
                        f"> {h['text'][:200]}…"
                    )

# --- User input ---
if prompt := st.chat_input("質問を入力してください"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        with st.spinner("検索 & 生成中..."):
            result = ask(prompt)
        st.markdown(result["answer"])

        if result["hits"]:
            with st.expander("🔍 検索 Top-K（デバッグ）"):
                for i, h in enumerate(result["hits"], 1):
                    st.markdown(
                        f"**#{i}** `{h['source']}` (chunk {h['chunk_index']}, dist={h['distance']:.4f})\n\n"
                        f"> {h['text'][:200]}…"
                    )

    st.session_state.messages.append({
        "role": "assistant",
        "content": result["answer"],
        "hits": result["hits"],
    })
