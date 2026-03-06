# サンプルプロジェクト概要

## 目的
このプロジェクトは、社内ドキュメントを活用したRAG（Retrieval-Augmented Generation）システムのMVPを構築することを目的としています。

## 技術スタック
- Python 3.11+
- Streamlit（UI）
- ChromaDB（ベクトルDB）
- OpenAI API（embedding & LLM）

## データ保存
ドキュメントデータはローカルの ChromaDB に保存されます。永続化ディレクトリは `chroma_db/` です。

## セキュリティポリシー
- 入力時にPIIマスクを適用
- プロンプトインジェクションを検知・拒否
- 出力時にNGワードをフィルタ

## チームと役割
- 開発リード: アーキテクチャ設計、コードレビュー
- MLエンジニア: embedding選定、チャンク戦略
- QA: 評価スクリプト作成、品質管理

## スケジュール
- Week 1: MVP構築（ingest + chat UI）
- Week 2: 評価・チューニング
- Week 3: ガードレール強化・ドキュメント整備

## テスト戦略
ユニットテスト＋eval_questions.json による自動回帰テストを行います。
品質指標: 回答率、引用率、キーワードヒット率。

## 障害対応
1. ログ（logs/audit.jsonl）を確認
2. Chroma DB を再構築（ingest.py 再実行）
3. OpenAI API のレート制限を確認

## コスト見積もり
- OpenAI API: 月額 $5〜20（利用量依存）
- インフラ: ローカル実行のため $0

## ロードマップ
- v1: ローカルMVP（現在）
- v2: 認証＋マルチユーザー
- v3: クラウドデプロイ＋モニタリング
