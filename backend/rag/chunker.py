"""テキストを固定長チャンクに分割する."""

def split_chunks(text: str, source: str, chunk_size: int = 512, overlap: int = 64) -> list[dict]:
    """Return list of {"id": ..., "text": ..., "source": ..., "chunk_index": ...}."""
    chunks = []
    start = 0
    idx = 0
    while start < len(text):
        end = start + chunk_size
        chunk_text = text[start:end].strip()
        if chunk_text:
            chunks.append({
                "id": f"{source}::chunk_{idx}",
                "text": chunk_text,
                "source": source,
                "chunk_index": idx,
            })
            idx += 1
        start += chunk_size - overlap
    return chunks
