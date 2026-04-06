import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RagApiService } from '../../services/rag-api.service';
import { AppSettings } from '../../models/interfaces';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel-body">

      <div class="section-title">⚙️ 現在の設定</div>

      <div class="setting-list" *ngIf="settings">
        <div class="setting-item">
          <span class="setting-key">Chat Model</span>
          <span class="setting-value">{{ settings.chat_model }}</span>
        </div>
        <div class="setting-item">
          <span class="setting-key">Embedding Model</span>
          <span class="setting-value">{{ settings.embed_model }}</span>
        </div>
        <div class="setting-item">
          <span class="setting-key">TOP_K</span>
          <span class="setting-value">{{ settings.top_k }}</span>
        </div>
        <div class="setting-item">
          <span class="setting-key">CHUNK_SIZE</span>
          <span class="setting-value">{{ settings.chunk_size }}</span>
        </div>
        <div class="setting-item">
          <span class="setting-key">CHUNK_OVERLAP</span>
          <span class="setting-value">{{ settings.chunk_overlap }}</span>
        </div>
        <div class="setting-item">
          <span class="setting-key">Guardrails Enabled</span>
          <span class="setting-value" [class.badge-on]="settings.guardrails_enabled" [class.badge-off]="!settings.guardrails_enabled">
            {{ settings.guardrails_enabled ? 'ON' : 'OFF' }}
          </span>
        </div>
      </div>

      <div class="empty-hint" *ngIf="!settings && !loading">
        <div class="empty-icon">⚙️</div>
        <div>設定を取得できませんでした</div>
      </div>

    </div>
  `,
  styles: [`
    .panel-body { display: flex; flex-direction: column; gap: 12px; }
    .section-title {
      font: 600 12px var(--font-sans); color: var(--text-secondary);
      text-transform: uppercase; letter-spacing: 0.06em; padding-bottom: 4px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .setting-list { display: flex; flex-direction: column; gap: 4px; }
    .setting-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 10px; border-radius: var(--radius-xs);
      border: 1px solid var(--border-subtle); background: var(--bg-tertiary);
      font-size: 12px;
    }
    .setting-key { color: var(--text-secondary); font: 500 12px var(--font-mono); }
    .setting-value { color: var(--text-primary); font: 500 12px var(--font-mono); }
    .badge-on {
      color: var(--success); background: rgba(72,199,142,0.1);
      padding: 2px 8px; border-radius: 100px; border: 1px solid var(--success);
    }
    .badge-off {
      color: var(--text-muted); background: var(--bg-secondary);
      padding: 2px 8px; border-radius: 100px; border: 1px solid var(--border-subtle);
    }
    .empty-hint {
      text-align: center; padding: 40px 20px;
      color: var(--text-muted); font-size: 13px; line-height: 1.8;
    }
    .empty-icon { font-size: 32px; margin-bottom: 8px; }
  `],
})
export class SettingsComponent implements OnInit {
  settings: AppSettings | null = null;
  loading = false;

  constructor(private ragApi: RagApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.ragApi.getSettings().subscribe({
      next: (s) => {
        this.settings = s;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
