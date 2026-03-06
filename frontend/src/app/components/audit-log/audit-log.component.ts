import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuditLogService } from '../../services/audit-log.service';
import { AuditLogEntry } from '../../models/interfaces';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel-body">
      <div class="empty-hint" *ngIf="(logs$ | async)?.length === 0">
        操作を行うとログが記録されます
      </div>

      <div class="log-entry" *ngFor="let log of logs$ | async">
        <span class="log-time">{{ formatTime(log.timestamp) }}</span>
        <span class="log-type" [ngClass]="log.event">
          [{{ log.event }}]
        </span>
        <div class="log-detail" *ngIf="log.query">"{{ log.query }}"</div>
        <div class="log-detail" *ngIf="log.sources">
          → {{ log.sources.join(', ') }}
        </div>
        <div class="log-detail" *ngIf="log.files">
          files: {{ log.files.join(', ') }} ({{ log.total_chunks }} chunks)
        </div>
      </div>
    </div>
  `,
  styles: [`
    .empty-hint {
      text-align: center; padding: 40px 20px;
      color: var(--text-muted); font-size: 13px;
    }
    .log-entry {
      font: 400 11px var(--font-mono); color: var(--text-secondary);
      padding: 8px 10px; border-left: 2px solid var(--border-subtle);
      margin-bottom: 6px; background: var(--bg-tertiary);
      border-radius: 0 var(--radius-xs) var(--radius-xs) 0; line-height: 1.5;
    }
    .log-time { color: var(--text-muted); font-size: 10px; }
    .log-type { font-weight: 600; margin: 0 4px; }
    .log-type.qa { color: var(--accent-bright); }
    .log-type.blocked_injection { color: var(--danger); }
    .log-type.ingest { color: var(--success); }
    .log-type.pii_masked { color: var(--warning); }
    .log-detail { padding-left: 8px; margin-top: 2px; }
  `],
})
export class AuditLogComponent implements OnInit {
  logs$!: Observable<AuditLogEntry[]>;

  constructor(private auditLogService: AuditLogService) {}

  ngOnInit(): void {
    this.logs$ = this.auditLogService.logs$;
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('ja-JP', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }
}
