# 📚 RAG Agent Console — Monorepo

> **社内ドキュメント検索 RAG チャットボット**
> Python バックエンド + Angular フロントエンドのモノレポ構成

## アーキテクチャ

```
rag-mvp/
├── backend/          Python RAG パイプライン（ingest / search / generate）
├── frontend/         Angular 19 SPA（TypeScript / Standalone Components）
└── prototype/        HTML プロトタイプ（UI 設計検証用）
```

## Quick Start

### Backend（Python）
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # API キー設定
python ingest.py      # ドキュメント取り込み
```

### Frontend（Angular）
```bash
cd frontend
npm install
ng serve              # http://localhost:4200
```

## 技術スタック

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 19, TypeScript, SCSS, RxJS |
| Backend | Python, OpenAI API, ChromaDB |
| Guardrails | PII Mask, Injection Detection, Output Filter |
| Eval | Automated 10-question eval pipeline |
| Logging | JSONL audit log |
