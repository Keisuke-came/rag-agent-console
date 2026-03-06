"""OpenAI Embedding API のラッパー."""
from openai import OpenAI
from rag.config import OPENAI_API_KEY, EMBED_MODEL

_client = OpenAI(api_key=OPENAI_API_KEY)

def get_embeddings(texts: list[str], model: str = EMBED_MODEL) -> list[list[float]]:
    """Return embeddings for a batch of texts (max 2048 per call)."""
    resp = _client.embeddings.create(input=texts, model=model)
    return [d.embedding for d in resp.data]
