import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, tap, catchError } from 'rxjs';
import { RagResponse, EvalResult, EvalSummary, DocumentInfo, DocumentPreview } from '../models/interfaces';
import { AuditLogService } from './audit-log.service';

const API_BASE = 'http://localhost:8000';

/**
 * RAG API サービス
 *
 * ask() は Python バックエンドの POST /api/ask を呼び出す。
 * getEvalResults / getDocuments は引き続きモック（スコープ外）。
 */
@Injectable({ providedIn: 'root' })
export class RagApiService {

  constructor(
    private http: HttpClient,
    private auditLog: AuditLogService,
  ) {}

  /** RAG 質問 API */
  ask(query: string): Observable<RagResponse> {
    return this.http.post<RagResponse>(`${API_BASE}/api/ask`, { query }).pipe(
      tap((res) => {
        // UI 用の監査ログ（バックエンドでも記録される）
        if (res.blocked) {
          this.auditLog.addEntry('blocked_injection', { query });
        } else {
          this.auditLog.addEntry('qa', {
            query,
            model: 'gpt-4o-mini',
            sources: res.hits.map((h) => h.source),
            answer_length: res.answer.length,
          });
        }
      }),
    );
  }

  /** 評価結果取得（モック） */
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

  /** 評価結果をバックエンドから取得 */
  getEvalData(): Observable<{ summary: EvalSummary | null; results: EvalResult[] }> {
    return this.http.get<{ summary: EvalSummary | null; results: EvalResult[] }>(
      `${API_BASE}/api/eval-summary`
    ).pipe(
      catchError(() => of({ summary: null, results: [] })),
    );
  }

  /** ドキュメント一覧取得 */
  getDocuments(): Observable<DocumentInfo[]> {
    return this.http.get<{ documents: DocumentInfo[] }>(`${API_BASE}/api/documents`).pipe(
      map((res) => res.documents),
      catchError(() => of([])),
    );
  }

  /** ドキュメント本文プレビュー取得 */
  getDocumentPreview(name: string): Observable<DocumentPreview> {
    const params = `?name=${encodeURIComponent(name)}`;
    return this.http.get<DocumentPreview>(`${API_BASE}/api/documents/preview${params}`).pipe(
      catchError(() => of({ name, content: '' })),
    );
  }
}
