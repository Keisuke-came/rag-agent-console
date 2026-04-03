import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, catchError, of } from 'rxjs';
import { AuditLogEntry } from '../models/interfaces';

const API_BASE = 'http://localhost:8000';

/** 監査ログサービス — BehaviorSubject で全コンポーネントにリアクティブ配信 */
@Injectable({ providedIn: 'root' })
export class AuditLogService {

  private readonly entries$ = new BehaviorSubject<AuditLogEntry[]>([]);

  constructor(private http: HttpClient) {}

  /** ログストリーム（最新が先頭） */
  get logs$(): Observable<AuditLogEntry[]> {
    return this.entries$.asObservable();
  }

  /** ログ追加 */
  addEntry(event: AuditLogEntry['event'], details: Partial<AuditLogEntry> = {}): void {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      event,
      ...details,
    };
    const current = this.entries$.getValue();
    this.entries$.next([entry, ...current]);
  }

  /** ログ全消去 */
  clear(): void {
    this.entries$.next([]);
  }

  /** バックエンドから永続化ログを取得 */
  fetchLogs(limit = 50): Observable<AuditLogEntry[]> {
    return this.http.get<{ logs: AuditLogEntry[] }>(`${API_BASE}/api/logs?limit=${limit}`).pipe(
      map((res) => res.logs),
      catchError(() => of([])),
    );
  }
}
