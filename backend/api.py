"""FastAPI エントリポイント — RAG HTTP API."""
import sys
import os

# backend/ ディレクトリを sys.path に追加して rag パッケージをインポート可能にする
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag.chain import ask

app = FastAPI(title="RAG Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


class AskRequest(BaseModel):
    query: str


@app.post("/api/ask")
def api_ask(req: AskRequest):
    """RAG 質問エンドポイント。
    Response: {"answer": str, "hits": list[dict], "blocked": bool}
    """
    return ask(req.query)


@app.get("/api/health")
def health():
    return {"status": "ok"}
