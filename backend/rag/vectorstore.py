"""Chroma ベクトルストアの薄いラッパー."""
import chromadb
from rag.config import CHROMA_DIR, TOP_K
from rag.embed import get_embeddings

COLLECTION_NAME = "rag_docs"

def get_collection() -> chromadb.Collection:
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

def add_chunks(chunks: list[dict], batch_size: int = 64) -> int:
    """Embed and upsert chunks. Return count."""
    col = get_collection()
    total = 0
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        texts = [c["text"] for c in batch]
        ids = [c["id"] for c in batch]
        metas = [{"source": c["source"], "chunk_index": c["chunk_index"]} for c in batch]
        embeddings = get_embeddings(texts)
        col.upsert(ids=ids, embeddings=embeddings, documents=texts, metadatas=metas)
        total += len(batch)
    return total

def search(query: str, top_k: int = TOP_K) -> list[dict]:
    """Return top-k results as list of {"text", "source", "chunk_index", "distance"}."""
    col = get_collection()
    q_emb = get_embeddings([query])
    results = col.query(query_embeddings=q_emb, n_results=top_k, include=["documents", "metadatas", "distances"])
    hits = []
    for doc, meta, dist in zip(
        results["documents"][0], results["metadatas"][0], results["distances"][0]
    ):
        hits.append({"text": doc, "source": meta["source"], "chunk_index": meta["chunk_index"], "distance": dist})
    return hits
