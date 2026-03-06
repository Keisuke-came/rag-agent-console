import { Injectable } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';
import { RagResponse, SearchHit, EvalResult, EvalSummary, DocumentInfo } from '../models/interfaces';
import { GuardrailsService } from './guardrails.service';
import { AuditLogService } from './audit-log.service';

/**
 * RAG API サービス
 *
 * 現在はモックデータを返す。本番では HttpClient に差し替え:
 *   return this.http.post<RagResponse>('/api/ask', { query });
 */
@Injectable({ providedIn: 'root' })
export class RagApiService {

  /** モックナレッジベース */
  private readonly knowledge: Record<string, { text: string; source: string; chunk: number; distance: number }> = {
    '目的': {
      text: 'このプロジェクトは、社内ドキュメントを活用したRAG（Retrieval-Augmented Generation）システムのMVPを構築することを目的としています。',
      source: 'sample_project.md', chunk: 0, distance: 0.0821,
    },
    '技術': {
      text: 'Python 3.11+、Streamlit（UI）、ChromaDB（ベクトルDB）、OpenAI API（embedding & LLM）を使用しています。',
      source: 'sample_project.md', chunk: 0, distance: 0.1243,
    },
    'セキュリティ': {
      text: '入力時にPIIマスクを適用、プロンプトインジェクションを検知・拒否、出力時にNGワードをフィルタしています。',
      source: 'sample_project.md', chunk: 1, distance: 0.0956,
    },
    'スケジュール': {
      text: 'Week 1: MVP構築、Week 2: 評価・チューニング、Week 3: ガードレール強化・ドキュメント整備の3週間計画です。',
      source: 'sample_project.md', chunk: 1, distance: 0.1567,
    },
    'チーム': {
      text: '開発リード（アーキテクチャ設計）、MLエンジニア（embedding選定）、QA（評価スクリプト作成）の3名体制です。',
      source: 'sample_project.md', chunk: 1, distance: 0.1102,
    },
    'テスト': {
      text: 'ユニットテスト＋eval_questions.jsonによる自動回帰テストを実施。品質指標として回答率、引用率、KWヒット率を計測します。',
      source: 'sample_project.md', chunk: 1, distance: 0.1334,
    },
    'コスト': {
      text: 'OpenAI API月額$5〜20（利用量依存）、インフラはローカル実行のため$0です。',
      source: 'sample_project.md', chunk: 1, distance: 0.1789,
    },
    'ロードマップ': {
      text: 'v1: ローカルMVP（現在）→ v2: 認証＋マルチユーザー → v3: クラウドデプロイ＋モニタリングを計画しています。',
      source: 'sample_project.md', chunk: 1, distance: 0.1456,
    },
    '障害': {
      text: '1. ログ確認、2. ChromaDB再構築（ingest.py再実行）、3. OpenAI APIレート制限確認の手順です。',
      source: 'sample_project.md', chunk: 1, distance: 0.1623,
    },
    'データ': {
      text: 'ドキュメントデータはローカルのChromaDBに保存されます。永続化ディレクトリはchroma_db/です。',
      source: 'sample_project.md', chunk: 0, distance: 0.0987,
    },
  };

  constructor(
    private guardrails: GuardrailsService,
    private auditLog: AuditLogService,
  ) {}

  /**
   * RAG 質問 API
   * 本番では: return this.http.post<RagResponse>(`${environment.apiUrl}/ask`, { query });
   */
  ask(query: string): Observable<RagResponse> {
    // 注入検知
    if (this.guardrails.detectInjection(query)) {
      this.auditLog.addEntry('blocked_injection', { query });
      return of({
        answer: '⚠️ 不正な指示が検知されました。質問を修正してください。',
        hits: [],
        blocked: true,
      });
    }

    // PII マスク
    const { text: safeQuery } = this.guardrails.maskPii(query);

    // 検索（モック）
    const hits = this.findHits(safeQuery);
    const answer = this.generateAnswer(hits);

    // 出力フィルタ
    const filteredAnswer = this.guardrails.filterOutput(answer);

    // 監査ログ
    this.auditLog.addEntry('qa', {
      query: safeQuery,
      model: 'gpt-4o-mini',
      sources: hits.map((h) => h.source),
      answer_length: filteredAnswer.length,
    });

    // レイテンシシミュレーション（0.8〜2秒）
    const latency = 800 + Math.random() * 1200;

    return of({
      answer: filteredAnswer,
      hits,
      blocked: false,
    }).pipe(delay(latency));
  }

  /** 評価結果取得 */
  getEvalResults(): Observable<EvalResult[]> {
    return of([
      { question: 'プロジェクトの目的は？', answered: true, has_citation: true, keyword_hit_rate: 0.50, latency_sec: 3.29, sources: 'sample_project.md', answer_preview: 'このプロジェクトの目的は...' },
      { question: '技術スタックを教えて', answered: true, has_citation: true, keyword_hit_rate: 1.00, latency_sec: 2.20, sources: 'sample_project.md', answer_preview: '主要な技術スタックは...' },
      { question: 'データの保存先は？', answered: true, has_citation: true, keyword_hit_rate: 1.00, latency_sec: 1.84, sources: 'sample_project.md', answer_preview: 'ドキュメントデータは...' },
      { question: 'セキュリティポリシーは？', answered: true, has_citation: true, keyword_hit_rate: 1.00, latency_sec: 2.37, sources: 'sample_project.md', answer_preview: 'セキュリティポリシーは...' },
      { question: 'チームの役割分担は？', answered: true, has_citation: true, keyword_hit_rate: 1.00, latency_sec: 2.37, sources: 'sample_project.md', answer_preview: 'チームメンバーの役割...' },
      { question: '開発スケジュールは？', answered: true, has_citation: true, keyword_hit_rate: 0.50, latency_sec: 3.37, sources: 'sample_project.md', answer_preview: '開発スケジュールは...' },
      { question: 'テスト戦略は？', answered: true, has_citation: true, keyword_hit_rate: 1.00, latency_sec: 3.09, sources: 'sample_project.md', answer_preview: 'テスト戦略は...' },
      { question: '障害対応手順は？', answered: true, has_citation: true, keyword_hit_rate: 1.00, latency_sec: 3.29, sources: 'sample_project.md', answer_preview: '障害発生時の対応...' },
      { question: 'コスト見積もりは？', answered: true, has_citation: true, keyword_hit_rate: 0.50, latency_sec: 2.47, sources: 'sample_project.md', answer_preview: 'コスト見積もりは...' },
      { question: 'ロードマップは？', answered: true, has_citation: true, keyword_hit_rate: 0.50, latency_sec: 4.85, sources: 'sample_project.md', answer_preview: '今後のロードマップ...' },
    ]);
  }

  /** 評価サマリ取得 */
  getEvalSummary(): Observable<EvalSummary> {
    return this.getEvalResults().pipe(
      map((results) => {
        const total = results.length;
        return {
          total,
          answered_rate: results.filter((r) => r.answered).length / total,
          citation_rate: results.filter((r) => r.has_citation).length / total,
          avg_keyword_hit: results.reduce((s, r) => s + r.keyword_hit_rate, 0) / total,
          avg_latency: results.reduce((s, r) => s + r.latency_sec, 0) / total,
        };
      })
    );
  }

  /** ドキュメント一覧取得 */
  getDocuments(): Observable<DocumentInfo[]> {
    return of([
      { name: 'sample_project.md', chunks: 2, size: '1.2KB' },
    ]);
  }

  // ── Private helpers ──

  private findHits(query: string): SearchHit[] {
    const hits: SearchHit[] = [];
    for (const [key, val] of Object.entries(this.knowledge)) {
      if (query.includes(key) || [...key].some((c) => query.includes(c))) {
        hits.push({
          text: val.text,
          source: val.source,
          chunk_index: val.chunk,
          distance: val.distance,
        });
      }
    }
    return hits.sort((a, b) => a.distance - b.distance).slice(0, 3);
  }

  private generateAnswer(hits: SearchHit[]): string {
    if (hits.length === 0) {
      return 'ドキュメントに該当する情報が見つかりませんでした。';
    }
    return hits.map((h) => `${h.text} [出典: ${h.source}]`).join('\n\n');
  }
}
