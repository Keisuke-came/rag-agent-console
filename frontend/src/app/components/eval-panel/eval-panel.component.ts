import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RagApiService } from '../../services/rag-api.service';
import { EvalResult, EvalSummary } from '../../models/interfaces';

@Component({
  selector: 'app-eval-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel-body">

      <!-- 未実行 -->
      <div class="empty-hint" *ngIf="!loading && !summary">
        <div class="empty-icon">📊</div>
        <div>評価未実行</div>
        <div class="empty-sub">backend/eval.py を実行すると結果が表示されます</div>
      </div>

      <!-- サマリー -->
      <div *ngIf="summary">
        <div class="total-label">総件数: {{ summary.total }} 問</div>
        <div class="eval-summary">
          <div class="eval-metric">
            <div class="em-value">{{ (summary.answered_rate * 100).toFixed(0) }}%</div>
            <div class="em-label">回答率</div>
          </div>
          <div class="eval-metric">
            <div class="em-value">{{ (summary.citation_rate * 100).toFixed(0) }}%</div>
            <div class="em-label">引用率</div>
          </div>
          <div class="eval-metric">
            <div class="em-value">{{ (summary.avg_keyword_hit * 100).toFixed(0) }}%</div>
            <div class="em-label">KWヒット率</div>
          </div>
          <div class="eval-metric">
            <div class="em-value">{{ summary.avg_latency.toFixed(1) }}s</div>
            <div class="em-label">平均レイテンシ</div>
          </div>
        </div>

        <!-- 結果一覧 -->
        <div class="eval-row" *ngFor="let r of results">
          <span class="eq">{{ r.question }}</span>
          <span class="er" [ngClass]="r.answered ? 'pass' : 'fail'">
            {{ r.answered ? 'PASS' : 'FAIL' }}
          </span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .empty-hint {
      text-align: center; padding: 40px 20px;
      color: var(--text-muted); font-size: 13px; line-height: 1.8;
    }
    .empty-icon { font-size: 32px; margin-bottom: 8px; }
    .empty-sub { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
    .total-label {
      font-size: 11px; color: var(--text-muted); margin-bottom: 8px; text-align: right;
    }
    .eval-summary {
      display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;
    }
    .eval-metric {
      background: var(--bg-tertiary); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm); padding: 12px; text-align: center;
    }
    .em-value { font: 700 22px var(--font-sans); color: var(--accent-bright); }
    .em-label {
      font-size: 10px; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;
    }
    .eval-row {
      display: flex; align-items: center; padding: 8px 10px;
      border-bottom: 1px solid var(--border-subtle); font-size: 12px; gap: 8px;
    }
    .eq { flex: 1; color: var(--text-secondary); }
    .er {
      font: 500 11px var(--font-mono); padding: 2px 8px; border-radius: 100px;
    }
    .er.pass { background: var(--success-bg); color: var(--success); }
    .er.fail { background: var(--danger-bg); color: var(--danger); }
  `],
})
export class EvalPanelComponent implements OnInit {
  results: EvalResult[] = [];
  summary: EvalSummary | null = null;
  loading = false;

  constructor(private ragApi: RagApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.ragApi.getEvalData().subscribe({
      next: (data) => {
        this.summary = data.summary;
        this.results = data.results;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
