#!/usr/bin/env python3
"""docs/ のファイルを読み込み → チャンク → embedding → Chroma に保存."""
import os, sys
from tqdm import tqdm
from rag.config import DOCS_DIR, CHUNK_SIZE, CHUNK_OVERLAP
from rag.loader import load_documents
from rag.chunker import split_chunks
from rag.vectorstore import add_chunks
from rag.logger import log_event

def main():
    if not os.listdir(DOCS_DIR):
        print(f"⚠️  {DOCS_DIR} にファイルがありません。PDF/MD を置いてから再実行してください。")
        sys.exit(1)

    print("📄 ドキュメント読み込み中...")
    docs = load_documents(DOCS_DIR)
    print(f"   → {len(docs)} ファイル読み込み完了")

    print("✂️  チャンク分割中...")
    all_chunks = []
    for doc in docs:
        chunks = split_chunks(doc["text"], doc["source"], CHUNK_SIZE, CHUNK_OVERLAP)
        all_chunks.extend(chunks)
    print(f"   → {len(all_chunks)} チャンク生成")

    print("🔢 Embedding & Chroma 保存中...")
    # tqdm でバッチ進捗を表示
    batch_size = 64
    stored = 0
    for i in tqdm(range(0, len(all_chunks), batch_size), desc="   Batches"):
        batch = all_chunks[i : i + batch_size]
        stored += add_chunks(batch, batch_size=len(batch))
    print(f"   → {stored} チャンク保存完了 ✅")

    log_event("ingest", files=[d["source"] for d in docs], total_chunks=len(all_chunks))

if __name__ == "__main__":
    main()
