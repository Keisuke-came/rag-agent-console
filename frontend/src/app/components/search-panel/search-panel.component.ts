import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchHit } from '../../models/interfaces';

@Component({
  selector: 'app-search-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel-body">
      <!-- Empty state -->
      <div class="empty-hint" *ngIf="hits.length === 0">
        質問を送信すると、検索結果がここに表示されます
      </div>

      <!-- Hit cards -->
      <div class="hit-card" *ngFor="let hit of hits; let i = index">
        <div class="hit-header">
          <span class="hit-rank">#{{ i + 1 }}</span>
          <span class="hit-score">dist: {{ hit.distance.toFixed(4) }}</span>
        </div>
        <div class="hit-source">📄 {{ hit.source }} — chunk {{ hit.chunk_index }}</div>
        <div class="hit-text">{{ hit.text }}</div>
        <div class="score-bar">
          <div class="score-bar-fill"
            [style.width.%]="getScorePercent(hit.distance)">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel-body { padding: 0; }
    .empty-hint {
      text-align: center; padding: 40px 20px;
      color: var(--text-muted); font-size: 13px;
    }
    .hit-card {
      background: var(--bg-tertiary); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm); padding: 12px; margin-bottom: 10px;
      transition: var(--transition);
    }
    .hit-card:hover { border-color: var(--border-active); }
    .hit-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 8px;
    }
    .hit-rank {
      font: 600 11px var(--font-mono); color: var(--accent-bright);
      background: var(--accent-glow); padding: 2px 8px; border-radius: 100px;
    }
    .hit-score { font: 500 11px var(--font-mono); color: var(--text-muted); }
    .hit-source {
      font: 500 12px var(--font-mono); color: var(--text-secondary); margin-bottom: 6px;
    }
    .hit-text {
      font-size: 12px; color: var(--text-muted); line-height: 1.6;
      display: -webkit-box; -webkit-line-clamp: 4;
      -webkit-box-orient: vertical; overflow: hidden;
    }
    .score-bar {
      height: 3px; background: var(--bg-card); border-radius: 2px;
      margin-top: 8px; overflow: hidden;
    }
    .score-bar-fill {
      height: 100%; border-radius: 2px;
      background: linear-gradient(90deg, var(--accent), var(--success));
      transition: width 0.5s ease;
    }
  `],
})
export class SearchPanelComponent {
  @Input() hits: SearchHit[] = [];

  getScorePercent(distance: number): number {
    return Math.max(0, Math.round((1 - distance) * 100));
  }
}
