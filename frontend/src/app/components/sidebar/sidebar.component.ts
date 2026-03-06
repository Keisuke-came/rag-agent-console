import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { RagApiService } from '../../services/rag-api.service';
import { DocumentInfo, GuardrailStatus } from '../../models/interfaces';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar">
      <!-- Conversations -->
      <section class="sidebar-section">
        <div class="sidebar-label">Conversations</div>
        <div class="sidebar-item active">
          <span class="si-icon">💬</span>
          <span>新しいチャット</span>
        </div>
      </section>

      <!-- Documents -->
      <section class="sidebar-section">
        <div class="sidebar-label">Documents</div>
        <div class="sidebar-item" *ngFor="let doc of documents$ | async">
          <span class="si-icon">📄</span>
          <span>{{ doc.name }}</span>
          <span class="si-badge">{{ doc.chunks }}</span>
        </div>
      </section>

      <!-- Guardrails -->
      <section class="sidebar-section">
        <div class="sidebar-label">Guardrails</div>
        <div class="guardrail-panel">
          <div class="gr-row">
            <span class="gr-label">PII マスク</span>
            <span class="gr-status" [class.on]="guardrailStatus.pii_mask">
              <span class="gr-dot" [class.on]="guardrailStatus.pii_mask"></span>
              {{ guardrailStatus.pii_mask ? 'Active' : 'Off' }}
            </span>
          </div>
          <div class="gr-row">
            <span class="gr-label">注入検知</span>
            <span class="gr-status" [class.on]="guardrailStatus.injection_detection">
              <span class="gr-dot" [class.on]="guardrailStatus.injection_detection"></span>
              {{ guardrailStatus.injection_detection ? 'Active' : 'Off' }}
            </span>
          </div>
          <div class="gr-row">
            <span class="gr-label">出力フィルタ</span>
            <span class="gr-status" [class.on]="guardrailStatus.output_filter">
              <span class="gr-dot" [class.on]="guardrailStatus.output_filter"></span>
              {{ guardrailStatus.output_filter ? 'Active' : 'Off' }}
            </span>
          </div>
        </div>
      </section>

      <!-- System -->
      <section class="sidebar-section sidebar-bottom">
        <div class="sidebar-label">System</div>
        <div class="sidebar-item">
          <span class="si-icon">📊</span>
          <span>Eval Results</span>
        </div>
        <div class="sidebar-item">
          <span class="si-icon">📋</span>
          <span>Audit Log</span>
        </div>
      </section>
    </aside>
  `,
  styles: [`
    .sidebar {
      background: var(--bg-secondary);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 16px 12px;
      height: 100%;
    }
    .sidebar-section { margin-bottom: 20px; }
    .sidebar-bottom { margin-top: auto; }
    .sidebar-label {
      font-size: 10px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--text-muted); padding: 0 8px 8px;
    }
    .sidebar-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: var(--radius-xs);
      font-size: 13px; color: var(--text-secondary);
      cursor: pointer; transition: var(--transition);
      border: 1px solid transparent;
    }
    .sidebar-item:hover {
      background: var(--accent-glow); color: var(--text-primary);
      border-color: var(--border-subtle);
    }
    .sidebar-item.active {
      background: var(--accent-glow); color: var(--accent-bright);
      border-color: var(--border-active);
    }
    .si-icon { width: 20px; text-align: center; font-size: 14px; }
    .si-badge {
      margin-left: auto; background: var(--accent); color: #fff;
      font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 100px;
    }
    .guardrail-panel {
      background: var(--bg-tertiary); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm); padding: 12px; margin-top: 8px;
    }
    .gr-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 5px 0; font-size: 12px;
    }
    .gr-label { color: var(--text-secondary); }
    .gr-status { display: flex; align-items: center; gap: 4px; font-weight: 500; }
    .gr-status.on { color: var(--success); }
    .gr-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); }
    .gr-dot.on { background: var(--success); box-shadow: 0 0 4px var(--success); }
  `],
})
export class SidebarComponent implements OnInit {
  documents$!: Observable<DocumentInfo[]>;

  guardrailStatus: GuardrailStatus = {
    pii_mask: true,
    injection_detection: true,
    output_filter: true,
  };

  constructor(private ragApi: RagApiService) {}

  ngOnInit(): void {
    this.documents$ = this.ragApi.getDocuments();
  }
}
