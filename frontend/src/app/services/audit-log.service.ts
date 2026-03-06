import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuditLogEntry } from '../models/interfaces';

/** 監査ログサービス — BehaviorSubject で全コンポーネントにリアクティブ配信 */
@Injectable({ providedIn: 'root' })
export class AuditLogService {

  private readonly entries$ = new BehaviorSubject<AuditLogEntry[]>([]);

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
}
