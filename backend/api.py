"""FastAPI エントリポイント — RAG HTTP API."""
import sys
import os
import json as _json
import csv as _csv

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


_EVAL_CSV = os.path.join(os.path.dirname(__file__), "eval", "eval_results.csv")


@app.get("/api/eval-summary")
def api_eval_summary():
    """評価結果サマリー取得エンドポイント。eval_results.csv を集計して返す。"""
    if not os.path.exists(_EVAL_CSV):
        return {"summary": None, "results": []}

    rows = []
    with open(_EVAL_CSV, encoding="utf-8") as f:
        for row in _csv.DictReader(f):
            rows.append({
                "question": row["question"],
                "answered": row["answered"] == "True",
                "has_citation": row["has_citation"] == "True",
                "keyword_hit_rate": float(row["keyword_hit_rate"]),
                "latency_sec": float(row["latency_sec"]),
                "sources": row["sources"],
                "answer_preview": row["answer_preview"],
            })

    if not rows:
        return {"summary": None, "results": []}

    total = len(rows)
    summary = {
        "total": total,
        "answered_rate": sum(1 for r in rows if r["answered"]) / total,
        "citation_rate": sum(1 for r in rows if r["has_citation"]) / total,
        "avg_keyword_hit": sum(r["keyword_hit_rate"] for r in rows) / total,
        "avg_latency": sum(r["latency_sec"] for r in rows) / total,
    }
    return {"summary": summary, "results": rows}


@app.get("/api/health")
def health():
    return {"status": "ok"}
