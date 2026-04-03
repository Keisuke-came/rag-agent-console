import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ChatComponent } from './components/chat/chat.component';
import { SearchPanelComponent } from './components/search-panel/search-panel.component';
import { AuditLogComponent } from './components/audit-log/audit-log.component';
import { EvalPanelComponent } from './components/eval-panel/eval-panel.component';
import { DocumentsComponent } from './components/documents/documents.component';
import { AuditLogService } from './services/audit-log.service';
import { SearchHit, PanelTab } from './models/interfaces';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    ChatComponent,
    SearchPanelComponent,
    AuditLogComponent,
    EvalPanelComponent,
    DocumentsComponent,
  ],
  template: `
    <div class="app-shell">
      <!-- Top Bar -->
      <header class="top-bar">
        <div class="top-bar-logo">
          <div class="icon-box">⚡</div>
          <span>RAG Agent Console</span>
        </div>
        <nav class="top-bar-nav">
          <button class="active">Chat</button>
          <button>Documents</button>
          <button>Settings</button>
        </nav>
        <div class="top-bar-status">
          <div class="status-badge">
            <div class="status-dot"></div>
            GPT-4o-mini
          </div>
          <div class="status-badge">
            ChromaDB ● 2 chunks
          </div>
        </div>
      </header>

      <!-- Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Main Chat -->
      <main class="main-content">
        <app-chat (hitsChanged)="onHitsChanged($event)"></app-chat>
      </main>

      <!-- Right Panel -->
      <aside class="right-panel">
        <div class="panel-tabs">
          <button class="panel-tab"
            *ngFor="let tab of panelTabs"
            [class.active]="activeTab === tab.id"
            (click)="activeTab = tab.id">
            {{ tab.icon }} {{ tab.label }}
          </button>
        </div>
        <div class="panel-content">
          <app-search-panel
            *ngIf="activeTab === 'search'"
            [hits]="currentHits">
          </app-search-panel>
          <app-audit-log *ngIf="activeTab === 'logs'"></app-audit-log>
          <app-eval-panel *ngIf="activeTab === 'eval'"></app-eval-panel>
          <app-documents *ngIf="activeTab === 'documents'"></app-documents>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .app-shell {
      display: grid;
      grid-template-columns: 280px 1fr 340px;
      grid-template-rows: 56px 1fr;
      height: 100vh; gap: 0;
    }

    .top-bar {
      grid-column: 1 / -1;
      display: flex; align-items: center; padding: 0 20px;
      background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle);
      gap: 16px; z-index: 10;
    }
    .top-bar-logo {
      display: flex; align-items: center; gap: 10px;
      font-weight: 600; font-size: 15px; letter-spacing: -0.01em;
    }
    .icon-box {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, var(--accent), #4f6fff);
      border-radius: var(--radius-xs);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; box-shadow: 0 2px 8px rgba(99,143,255,0.3);
    }
    .top-bar-nav { display: flex; gap: 4px; margin-left: 32px; }
    .top-bar-nav button {
      background: none; border: none; color: var(--text-secondary);
      font: 500 13px var(--font-sans); padding: 8px 14px;
      border-radius: var(--radius-xs); cursor: pointer; transition: var(--transition);
    }
    .top-bar-nav button:hover { background: var(--accent-glow); color: var(--text-primary); }
    .top-bar-nav button.active {
      background: var(--accent-glow); color: var(--accent-bright);
      box-shadow: inset 0 -2px 0 var(--accent);
    }
    .top-bar-status { margin-left: auto; display: flex; align-items: center; gap: 12px; }
    .status-badge {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: var(--text-secondary);
      background: var(--bg-tertiary); padding: 4px 10px;
      border-radius: 100px; border: 1px solid var(--border-subtle);
    }
    .status-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--success); box-shadow: 0 0 6px var(--success);
      animation: pulse 2s infinite;
    }

    .main-content {
      display: flex; flex-direction: column; background: var(--bg-primary); min-width: 0;
      overflow: hidden;
    }
    app-chat { flex: 1; min-height: 0; }

    .right-panel {
      background: var(--bg-secondary); border-left: 1px solid var(--border-subtle);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .panel-tabs { display: flex; border-bottom: 1px solid var(--border-subtle); }
    .panel-tab {
      flex: 1; padding: 12px 8px; font: 500 12px var(--font-sans);
      color: var(--text-secondary); background: none; border: none;
      cursor: pointer; transition: var(--transition);
      border-bottom: 2px solid transparent; text-align: center;
    }
    .panel-tab:hover { color: var(--text-primary); background: var(--accent-glow); }
    .panel-tab.active {
      color: var(--accent-bright); border-bottom-color: var(--accent);
    }
    .panel-content { flex: 1; overflow-y: auto; padding: 16px; }

    @media (max-width: 1024px) {
      .app-shell { grid-template-columns: 1fr; }
      app-sidebar, .right-panel { display: none; }
    }
  `],
})
export class AppComponent implements OnInit {
  activeTab: PanelTab = 'search';
  currentHits: SearchHit[] = [];

  panelTabs: { id: PanelTab; icon: string; label: string }[] = [
    { id: 'search', icon: '🔍', label: 'Search' },
    { id: 'logs', icon: '📋', label: 'Logs' },
    { id: 'eval', icon: '📊', label: 'Eval' },
    { id: 'documents', icon: '📄', label: 'Docs' },
  ];

  constructor(private auditLog: AuditLogService) {}

  ngOnInit(): void {
    // 初期ログ: ingest 完了
    this.auditLog.addEntry('ingest', {
      files: ['sample_project.md'],
      total_chunks: 2,
    });
  }

  onHitsChanged(hits: SearchHit[]): void {
    this.currentHits = hits;
    this.activeTab = 'search';
  }
}
