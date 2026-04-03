import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RagApiService } from '../../services/rag-api.service';
import { DocumentInfo, DocumentPreview } from '../../models/interfaces';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel-body">

      <!-- 0件 -->
      <div class="empty-hint" *ngIf="!loading && documents.length === 0">
        <div class="empty-icon">📄</div>
        <div>登録済み文書がありません</div>
        <div class="empty-sub">backend/docs/ にファイルを追加して ingest してください</div>
      </div>

      <!-- 一覧 -->
      <div class="doc-list" *ngIf="documents.length > 0">
        <div class="doc-item"
             *ngFor="let doc of documents"
             [class.selected]="selectedDoc?.name === doc.name"
             (click)="selectDoc(doc)">
          <span class="doc-icon">📄</span>
          <span class="doc-name">{{ doc.name }}</span>
          <span class="doc-size">{{ doc.size }}</span>
        </div>
      </div>

      <!-- プレビュー -->
      <div class="doc-preview" *ngIf="preview">
        <div class="preview-header">{{ preview.name }}</div>
        <pre class="preview-body">{{ preview.content }}</pre>
      </div>

    </div>
  `,
  styles: [`
    .panel-body { display: flex; flex-direction: column; gap: 8px; }
    .empty-hint {
      text-align: center; padding: 40px 20px;
      color: var(--text-muted); font-size: 13px; line-height: 1.8;
    }
    .empty-icon { font-size: 32px; margin-bottom: 8px; }
    .empty-sub { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

    .doc-list { display: flex; flex-direction: column; gap: 4px; }
    .doc-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; border-radius: var(--radius-xs);
      border: 1px solid var(--border-subtle); background: var(--bg-tertiary);
      cursor: pointer; font-size: 12px; transition: var(--transition);
    }
    .doc-item:hover { background: var(--accent-glow); border-color: var(--accent); }
    .doc-item.selected {
      background: var(--accent-glow); border-color: var(--accent);
      color: var(--accent-bright);
    }
    .doc-icon { font-size: 14px; flex-shrink: 0; }
    .doc-name { flex: 1; color: var(--text-primary); font: 500 12px var(--font-mono); }
    .doc-size { font-size: 10px; color: var(--text-muted); flex-shrink: 0; }

    .doc-preview {
      border: 1px solid var(--border-subtle); border-radius: var(--radius-xs);
      overflow: hidden; margin-top: 4px;
    }
    .preview-header {
      padding: 6px 10px; background: var(--bg-tertiary);
      border-bottom: 1px solid var(--border-subtle);
      font: 600 11px var(--font-mono); color: var(--text-secondary);
    }
    .preview-body {
      margin: 0; padding: 10px; max-height: 300px; overflow-y: auto;
      font: 400 11px var(--font-mono); color: var(--text-secondary);
      white-space: pre-wrap; word-break: break-word; line-height: 1.6;
      background: var(--bg-primary);
    }
  `],
})
export class DocumentsComponent implements OnInit {
  documents: DocumentInfo[] = [];
  selectedDoc: DocumentInfo | null = null;
  preview: DocumentPreview | null = null;
  loading = false;

  constructor(private ragApi: RagApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.ragApi.getDocuments().subscribe({
      next: (docs) => {
        this.documents = docs;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  selectDoc(doc: DocumentInfo): void {
    this.selectedDoc = doc;
    this.ragApi.getDocumentPreview(doc.name).subscribe((p) => {
      this.preview = p;
    });
  }
}
