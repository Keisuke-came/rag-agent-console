"""FastAPI エントリポイント — RAG HTTP API."""
import sys
import os
import json as _json

# backend/ ディレクトリを sys.path に追加して rag パッケージをインポート可能にする
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag.chain import ask
from rag.config import LOGS_DIR

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


@app.get("/api/logs")
def api_logs(limit: int = Query(default=50, ge=1, le=500)):
    """監査ログ取得エンドポイント。直近 limit 件を新しい順で返す。"""
    log_path = os.path.join(LOGS_DIR, "audit.jsonl")
    if not os.path.exists(log_path):
        return {"logs": []}
    entries = []
    with open(log_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    entries.append(_json.loads(line))
                except Exception:
                    pass
    return {"logs": list(reversed(entries[-limit:]))}


@app.get("/api/health")
def health():
    return {"status": "ok"}
