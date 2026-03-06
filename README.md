# 📚 RAG Agent Console

> **社内ドキュメントをベクトル検索し、根拠引用つきで回答する RAG チャットボット。**
> ガードレール・監査ログ・自動評価パイプラインを備えた、企業利用を意識した MVP です。

![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-0.6-green)

---

## デモ

| Angular SPA（フロントエンド） | Streamlit（バックエンド確認用） |
|:---:|:---:|
| ![angular demo](docs/images/angular_demo.png) | ![streamlit demo](docs/images/streamlit_demo.png) |

> スクリーンショットは `docs/images/` に配置してください

---

## このプロジェクトが解決する課題

```
❌ 従来の課題
   社内ドキュメントが増え続け、必要な情報を探すのに時間がかかる。
   LLM に直接聞いても、社内情報を知らないのでハルシネーション（もっともらしい嘘）を返す。

✅ RAG による解決
   「まず社内ドキュメントから関連箇所を検索し、それを根拠に LLM が回答する」
   → 嘘をつかない。出典が明示される。ドキュメント更新時も再学習不要。
```

---

## なぜ RAG を選んだか

```mermaid
graph LR
    A["🤔 社内情報に<br>答えさせたい"] --> B{"手法の選択"}
    B -->|"プロンプトに<br>全文貼り付け"| C["❌ トークン上限で<br>スケールしない"]
    B -->|"ファインチューニング"| D["❌ GPU必要<br>更新のたび再学習"]
    B -->|"RAG"| E["✅ API料金のみ<br>更新は再ingestだけ"]
    
    style E fill:#1a4d2e,stroke:#34d399,color:#fff
    style C fill:#4d1a1a,stroke:#f87171,color:#fff
    style D fill:#4d1a1a,stroke:#f87171,color:#fff
```

| 手法 | コスト | セットアップ | ドキュメント更新 | 判断 |
|------|--------|-------------|-----------------|------|
| プロンプトに全文貼り付け | 安い | 簡単 | トークン上限に引っかかる | ✗ スケールしない |
| ファインチューニング | 高い (GPU) | 大変 | 再学習が必要 | ✗ MVP に不適 |
| **RAG** | **API 料金のみ** | **中程度** | **再 ingest のみ** | **✓ 採用** |

---

## システムアーキテクチャ

### 全体構成

```mermaid
graph TB
    subgraph Frontend["🖥️ Frontend — Angular 19 SPA"]
        UI["Chat UI<br>app.component"]
        SB["Sidebar<br>sidebar.component"]
        SP["Search Panel<br>search-panel.component"]
        AL["Audit Log<br>audit-log.component"]
        EP["Eval Panel<br>eval-panel.component"]
        GS["GuardrailsService"]
        RS["RagApiService"]
        LS["AuditLogService<br>BehaviorSubject"]
    end

    subgraph Backend["⚙️ Backend — Python"]
        direction TB
        subgraph Ingest["📥 Ingest パイプライン"]
            A["docs/<br>PDF・MD"] --> B["loader.py<br>テキスト抽出"]
            B --> C["chunker.py<br>512文字 / overlap 64"]
            C --> D["embed.py<br>OpenAI Embedding"]
            D --> E[("ChromaDB<br>ベクトル保存")]
        end

        subgraph Query["💬 Query パイプライン"]
            F["ユーザー質問"] --> G{"guardrails.py<br>入力フィルタ"}
            G -->|"安全"| H["embed.py<br>クエリ Embedding"]
            G -->|"注入検知"| G2["🛡️ 拒否"]
            G -->|"PII検出"| G1["🔒 マスク処理"]
            G1 --> H
            H --> I["vectorstore.py<br>Top-K 検索"]
            I --> J["chain.py<br>プロンプト構築"]
            J --> K["OpenAI GPT<br>回答生成"]
            K --> L{"guardrails.py<br>出力フィルタ"}
            L --> M["引用付き回答"]
        end

        subgraph Ops["🔧 運用基盤"]
            N["logger.py<br>監査ログ JSONL"]
            O["eval.py<br>自動評価 → CSV"]
        end
    end

    UI --> RS
    RS --> F
    M --> RS
    J --> N
    G2 --> N
    E -.->|"ベクトル検索"| I

    style Frontend fill:#0f172a,stroke:#638fff,color:#e8ecf4
    style Backend fill:#111827,stroke:#34d399,color:#e8ecf4
```

### データフローの要約

```
📄 PDF/MD ──→ テキスト抽出 ──→ 512文字チャンク ──→ Embedding ──→ ChromaDB に保存
                                                                        │
👤 ユーザー質問 ──→ ガードレール ──→ Embedding ──→ ベクトル検索 ──────────┘
                     (PII/注入)                         │
                                                   Top-3 チャンク
                                                        │
                                                  プロンプト構築 ──→ GPT-4o-mini ──→ 出力フィルタ ──→ 💬 引用付き回答
```

---

## 主な機能

| 機能 | 実装内容 | なぜ入れたか |
|------|----------|-------------|
| **RAG パイプライン** | PDF/MD → チャンク → Embedding → Chroma → 検索 → LLM | ハルシネーション抑制。ドキュメント更新時も再学習不要 |
| **根拠引用** | 回答の各文に `[出典: ファイル名]` を自動付与 | ユーザーが原文を検証でき、回答の信頼性を担保 |
| **3層ガードレール** | 入力PII マスク / プロンプト注入検知 / 出力NG・PIIフィルタ | 企業利用では「動く」だけでなく「安全に動く」が必須 |
| **監査ログ** | 全クエリ・回答・ソースを JSONL で記録 | コンプライアンス対応。後付けすると全体に影響するため初期から設計 |
| **自動評価** | 10問の質問セットで回答率・引用率・KWヒット率・レイテンシを自動計測 | LLMアプリの「回帰テスト」。変更のたびに品質を自動検証 |
| **デバッグUI** | 検索 Top-K のチャンク内容・コサイン距離を展開表示 | 「検索が悪いのか、生成が悪いのか」を切り分けるため |
| **Angular SPA** | 3カラムレイアウト / リアルタイムガードレール状態表示 | SPA開発スキルの証明 + 本番フロントエンドの設計検証 |

---

## ガードレールの仕組み

```mermaid
flowchart LR
    subgraph Input["📥 入力ガードレール"]
        I1["PII 検出<br>電話・メール・カード番号"] --> I2["マスク処理<br>090-xxxx → [電話番号]"]
        I3["インジェクション検知<br>「前の指示を無視して」等"] --> I4["🛡️ 即座に拒否"]
    end

    subgraph Output["📤 出力ガードレール"]
        O1["PII マスク<br>LLM出力にも適用"] --> O2["NGワード除去<br>機密情報フィルタ"]
    end

    User["👤 ユーザー入力"] --> Input
    Input -->|"安全なクエリ"| LLM["🤖 LLM"]
    LLM --> Output
    Output --> Response["💬 安全な回答"]

    style I4 fill:#4d1a1a,stroke:#f87171,color:#fff
    style Response fill:#1a4d2e,stroke:#34d399,color:#fff
```

**なぜ入力と出力の両方にフィルタが必要か：**
入力側でPIIをマスクしても、LLMが参考文書中の機密情報をそのまま出力する可能性がある。二重防御が企業利用の鉄則。

---

## 設計判断の詳細

### チャンクサイズ: 512 / オーバーラップ: 64

```mermaid
graph LR
    subgraph Small["チャンク 256"]
        S1["✅ 検索精度が高い"]
        S2["❌ 文脈が切れやすい"]
    end
    subgraph Medium["チャンク 512 ← 採用"]
        M1["✅ 精度と文脈のバランス"]
        M2["✅ 汎用的な出発点"]
    end
    subgraph Large["チャンク 1024"]
        L1["✅ 広い文脈を保持"]
        L2["❌ 検索ノイズが増える"]
    end

    style Medium fill:#1a4d2e,stroke:#34d399,color:#fff
```

- **512 文字**: 検索精度（小さいほど良い）と文脈保持（大きいほど良い）のバランス
- **64 文字オーバーラップ** (≒12%): チャンク境界での情報欠落を防止
- 本番では `eval.py` の結果を見ながらドキュメント特性に合わせて調整

### Embedding モデル

| モデル | 次元数 | コスト | 判断 |
|--------|--------|--------|------|
| text-embedding-3-small | 1536 | 安い | **✓ MVP で採用** |
| text-embedding-3-large | 3072 | 約3倍 | 本番で検討 |
| OSS (e5-large 等) | 様々 | 無料 | オフライン要件時 |

`.env` の 1 行変更で切り替え可能な設計。`embed.py` だけの修正で OSS モデルにも対応可能。

### ベクトル DB: ChromaDB

- `pip install` だけで動く。外部サービス不要で「ローカル完結」要件に最適
- 本番では Pinecone / pgvector への移行を想定
- **`vectorstore.py` だけの差し替えで移行可能**な設計

### temperature: 0.2

- `0.0`: 完全決定的だが表現が硬い
- `0.2`: ほぼ決定的 + 自然な表現。**事実ベースの RAG に最適**
- `0.7+`: ハルシネーションリスクが上がる

---

## プロジェクト構成

```
rag-agent-console/
│
├── backend/                    ⚙️ Python RAG バックエンド
│   ├── rag/                    コアモジュール（単一責任で分割）
│   │   ├── config.py           .env 読み込み
│   │   ├── loader.py           PDF / MD テキスト抽出
│   │   ├── chunker.py          固定長チャンク分割
│   │   ├── embed.py            OpenAI Embedding ラッパー
│   │   ├── vectorstore.py      ChromaDB CRUD
│   │   ├── guardrails.py       PII マスク / 注入検知 / 出力フィルタ
│   │   ├── chain.py            検索 → LLM 回答チェーン
│   │   └── logger.py           監査ログ (JSONL)
│   ├── docs/                   取り込み対象ドキュメント
│   ├── eval/                   評価用質問 & 結果
│   ├── ingest.py               ドキュメント取り込みスクリプト
│   ├── app.py                  Streamlit チャット UI
│   └── eval.py                 自動評価スクリプト
│
├── frontend/                   🖥️ Angular 19 SPA
│   └── src/app/
│       ├── components/         UI コンポーネント（5つ）
│       │   ├── chat/           チャット画面 + 入力
│       │   ├── sidebar/        ナビ + ガードレール状態
│       │   ├── search-panel/   Top-K 検索結果表示
│       │   ├── audit-log/      監査ログビューア
│       │   └── eval-panel/     評価結果ダッシュボード
│       ├── services/           ビジネスロジック（3つ）
│       │   ├── rag-api.service.ts        RAG API 通信
│       │   ├── guardrails.service.ts     入出力フィルタ
│       │   └── audit-log.service.ts      ログ管理（RxJS）
│       └── models/
│           └── interfaces.ts   TypeScript 型定義
│
└── prototype/                  🎨 HTML プロトタイプ（UI 設計検証用）
```

**モジュール設計の方針：** 各ファイルを単一責任に保ち、「LLM を別プロバイダーに変えたい」「ベクトル DB を Pinecone に移したい」といった変更が 1 ファイルの修正で済むようにしています。

---

## 技術スタック

| レイヤー | 技術 | 選定理由 |
|----------|------|----------|
| **Frontend** | Angular 19 / TypeScript / SCSS / RxJS | Standalone Components で最新設計。BehaviorSubject でリアクティブなログ配信 |
| **Backend** | Python 3.9+ | LLM/ML エコシステムの中心。ライブラリが豊富 |
| **LLM** | OpenAI GPT-4o-mini | コスト効率が高い。環境変数で GPT-4o 等に切替可能 |
| **Embedding** | text-embedding-3-small | 安価で MVP に十分な精度。1行変更で large に切替可能 |
| **ベクトル DB** | ChromaDB | ローカル完結。pip install だけで使える |
| **UI（確認用）** | Streamlit | Python だけで即座に UI を構築 |
| **ガードレール** | 正規表現 + キーワードマッチ | MVP ではシンプルに。本番では分類モデルに置換 |
| **ログ** | JSONL | 追記型で DB 不要。jq / Datadog で分析可能 |
| **評価** | 自作スクリプト + CSV | CI に組み込み可能な自動回帰テスト |

---

## セットアップ

### 前提条件

- Python 3.9+
- Node.js 18+
- OpenAI API キー

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # ← OPENAI_API_KEY を設定
python ingest.py        # ドキュメント取り込み
streamlit run app.py    # http://localhost:8501
python eval.py          # 自動評価 → eval/eval_results.csv
```

### Frontend

```bash
cd frontend
npm install
npx ng serve            # http://localhost:4200
```

---

## 評価結果

サンプルドキュメント（`sample_project.md`）での実行結果：

| 指標 | 結果 | 意味 |
|------|------|------|
| 回答率 | **10/10 (100%)** | 「見つかりません」ではなく回答できた割合 |
| 引用率 | **10/10 (100%)** | 出典が明示された割合 |
| KW ヒット率 | **18%** | キーワード完全一致（粗い指標） |
| 平均レイテンシ | **2.9s** | 質問から回答までの時間 |

> KW ヒット率が低いのは完全一致評価のため。LLM が同じ意味を別の言葉で表現した場合にヒットしない。
> 本番では **LLM-as-Judge**（GPT-4 に採点させる）に置き換えることで意味ベースの評価が可能。

---

## 本番に向けた拡張ロードマップ

```mermaid
graph LR
    subgraph Now["🟢 MVP（現在）"]
        N1["固定長チャンク"]
        N2["キーワードガードレール"]
        N3["KWヒット率評価"]
        N4["ChromaDB"]
        N5["JSONLログ"]
        N6["単一ユーザー"]
    end

    subgraph Next["🟡 本番 v1"]
        X1["セマンティック分割"]
        X2["分類モデル<br>Azure Content Safety"]
        X3["LLM-as-Judge"]
        X4["Pinecone / pgvector"]
        X5["Datadog / CloudWatch"]
        X6["認証 + RBAC"]
    end

    N1 --> X1
    N2 --> X2
    N3 --> X3
    N4 --> X4
    N5 --> X5
    N6 --> X6

    style Now fill:#1a2236,stroke:#638fff,color:#e8ecf4
    style Next fill:#1a4d2e,stroke:#34d399,color:#e8ecf4
```

| MVP の現状 | 本番での拡張 |
|-----------|-------------|
| 固定長チャンク (512) | セマンティック分割（見出し・段落単位） |
| キーワードガードレール | 分類モデル (Lakera Guard / Azure Content Safety) |
| KW ヒット率評価 | LLM-as-Judge（GPT-4 自動採点） |
| ChromaDB（ローカル） | Pinecone / pgvector（マネージド / 既存 DB 活用） |
| JSONL ファイルログ | 構造化ログ基盤（Datadog / CloudWatch） |
| 単一ユーザー | 認証 + RBAC + マルチテナント |

---

## トラブルシューティング

<details>
<summary><strong>❶ openai.AuthenticationError が出る</strong></summary>

`.env` に正しい API キーが設定されているか確認：

```bash
cat .env | grep OPENAI_API_KEY
python -c "from rag.config import OPENAI_API_KEY; print(OPENAI_API_KEY[:8])"
```

</details>

<details>
<summary><strong>❷ ChromaDB のエラー / 検索結果が空</strong></summary>

DB を削除して再構築：

```bash
rm -rf chroma_db/
python ingest.py
```

</details>

<details>
<summary><strong>❸ PDF からテキストが抽出できない（スキャン PDF）</strong></summary>

```bash
python -c "
from pypdf import PdfReader
r = PdfReader('docs/yourfile.pdf')
print(repr(r.pages[0].extract_text()[:200]))
"
```

テキストが空なら OCR 済み PDF に差し替えるか `pymupdf` / `pdfplumber` を検討。

</details>

<details>
<summary><strong>❹ Angular の ng serve でエラー</strong></summary>

```bash
cd frontend
rm -rf node_modules
npm install
npx ng serve
```

</details>

---

## ライセンス

MIT
