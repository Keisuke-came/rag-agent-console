import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditLogService } from '../../services/audit-log.service';
import { AuditLogEntry } from '../../models/interfaces';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel-body">
      <div class="log-header">
        <span class="log-count" *ngIf="logs.length > 0">{{ logs.length }} 件</span>
        <button class="refresh-btn" (click)="load()" [disabled]="loading">
          {{ loading ? '読み込み中...' : '↺ 更新' }}
        </button>
      </div>

      <div class="empty-hint" *ngIf="!loading && logs.length === 0">
        ログがありません
      </div>

      <div class="log-entry" *ngFor="let log of logs"
           [class.blocked]="log.event === 'blocked_injection'">
        <div class="log-meta">
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="blocked-badge" *ngIf="log.event === 'blocked_injection'">BLOCKED</span>
          <span class="log-type" [ngClass]="log.event">[{{ log.event }}]</span>
        </div>
        <div class="log-detail" *ngIf="log.query">"{{ log.query }}"</div>
        <div class="log-detail" *ngIf="log.sources?.length">
          → {{ log.sources!.join(', ') }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel-body { display: flex; flex-direction: column; gap: 6px; }
    .log-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 4px; min-height: 24px;
    }
    .log-count { font-size: 11px; color: var(--text-muted); }
    .refresh-btn {
      font-size: 11px; padding: 3px 8px;
      background: var(--bg-tertiary); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xs); cursor: pointer; color: var(--text-secondary);
    }
    .refresh-btn:hover { color: var(--text-primary); }
    .refresh-btn:disabled { opacity: 0.5; cursor: default; }
    .empty-hint {
      text-align: center; padding: 40px 20px;
      color: var(--text-muted); font-size: 13px;
    }
    .log-entry {
      font: 400 11px var(--font-mono); color: var(--text-secondary);
      padding: 8px 10px; border-left: 2px solid var(--border-subtle);
      background: var(--bg-tertiary);
      border-radius: 0 var(--radius-xs) var(--radius-xs) 0; line-height: 1.5;
    }
    .log-entry.blocked {
      border-left-color: var(--danger);
      background: rgba(255, 80, 80, 0.06);
    }
    .log-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .log-time { color: var(--text-muted); font-size: 10px; }
    .blocked-badge {
      font-size: 9px; font-weight: 700; letter-spacing: 0.05em;
      padding: 1px 5px; border-radius: 3px;
      background: var(--danger); color: #fff;
    }
    .log-type { font-weight: 600; }
    .log-type.qa { color: var(--accent-bright); }
    .log-type.blocked_injection { color: var(--danger); }
    .log-type.ingest { color: var(--success); }
    .log-type.pii_masked { color: var(--warning); }
    .log-detail { padding-left: 8px; margin-top: 2px; }
  `],
})
export class AuditLogComponent implements OnInit {
  logs: AuditLogEntry[] = [];
  loading = false;

  constructor(private auditLogService: AuditLogService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.auditLogService.fetchLogs().subscribe({
      next: (logs) => {
        this.logs = logs;
        this.loading = false;
      },
      error: () => {
        this.logs = [];
        this.loading = false;
      },
    });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleString('ja-JP', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }
}
