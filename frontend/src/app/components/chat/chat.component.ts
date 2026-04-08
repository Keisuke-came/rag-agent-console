import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage, SearchHit } from '../../models/interfaces';
import { RagApiService } from '../../services/rag-api.service';
import { GuardrailsService } from '../../services/guardrails.service';
import { AuditLogService } from '../../services/audit-log.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <!-- Messages -->
      <div class="chat-scroll" #chatScroll>
        <!-- Empty state -->
        <div class="empty-state" *ngIf="messages.length === 0">
          <div class="empty-icon">📚</div>
          <div class="empty-title">RAG Agent Console</div>
          <div class="empty-desc">
            社内ドキュメントをベクトル検索し、根拠引用つきで回答します。
          </div>
          <div class="quick-actions">
            <button class="quick-action"
              *ngFor="let q of quickQuestions"
              (click)="submitQuick(q)">
              {{ q }}
            </button>
          </div>
        </div>

        <!-- Message list -->
        <div *ngFor="let msg of messages; let i = index" class="message" [ngClass]="msg.role">
          <div class="message-avatar">
            {{ msg.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-body">
            <div class="message-meta">
              <span class="message-name">{{ msg.role === 'user' ? 'You' : 'RAG Agent' }}</span>
              <span class="message-time">{{ msg.timestamp | date:'HH:mm' }}</span>
              <button class="copy-btn"
                *ngIf="msg.role === 'assistant'"
                (click)="copyMessage(msg.content, i)"
                [title]="copiedIndex === i ? 'コピー済み' : '回答をコピー'">
                {{ copiedIndex === i ? '✓ コピー済み' : 'コピー' }}
              </button>
            </div>
            <div class="message-content" [innerHTML]="formatContent(msg.content)"></div>
            <!-- Guardrail badges -->
            <div class="guardrail-badge blocked" *ngIf="msg.blocked">
              🛡️ Injection Blocked
            </div>
            <div class="guardrail-badge masked" *ngIf="msg.masked">
              🔒 PII Masked
            </div>
            <div class="guardrail-badge safe"
              *ngIf="msg.role === 'assistant' && !msg.blocked">
              ✓ Guardrails Passed
            </div>
          </div>
        </div>

        <!-- Typing indicator -->
        <div class="message assistant" *ngIf="isLoading">
          <div class="message-avatar">🤖</div>
          <div class="message-body">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="input-area">
        <div class="input-wrapper" [class.focused]="inputFocused">
          <textarea
            #inputEl
            [(ngModel)]="inputText"
            (keydown)="onKeydown($event)"
            (focus)="inputFocused = true"
            (blur)="inputFocused = false"
            placeholder="質問を入力してください…"
            rows="1">
          </textarea>
          <button class="send-btn"
            [disabled]="!inputText.trim() || isLoading"
            (click)="send()">
            ➜
          </button>
        </div>
        <div class="input-hint">Enter で送信 ・ Shift+Enter で改行 ・ ガードレール自動適用中</div>
      </div>
    </div>
  `,
  styles: [`
    .chat-container { display: flex; flex-direction: column; height: 100%; }

    .chat-scroll {
      flex: 1; overflow-y: auto; padding: 24px 32px; scroll-behavior: smooth;
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 100%; gap: 16px; text-align: center; padding: 40px;
    }
    .empty-icon {
      width: 72px; height: 72px; background: var(--accent-glow);
      border-radius: 20px; display: flex; align-items: center; justify-content: center;
      font-size: 32px; border: 1px solid var(--border-active);
    }
    .empty-title { font-size: 18px; font-weight: 600; }
    .empty-desc { font-size: 13px; color: var(--text-muted); max-width: 320px; line-height: 1.6; }
    .quick-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
    .quick-action {
      font: 400 12px var(--font-sans); color: var(--text-secondary);
      background: var(--bg-tertiary); border: 1px solid var(--border-subtle);
      padding: 8px 14px; border-radius: 100px; cursor: pointer; transition: var(--transition);
    }
    .quick-action:hover {
      border-color: var(--accent); color: var(--accent-bright); background: var(--accent-glow);
    }

    .message {
      display: flex; gap: 12px; margin-bottom: 24px;
      animation: fadeInUp 0.3s ease;
    }
    .message-avatar {
      width: 34px; height: 34px; border-radius: var(--radius-xs);
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; flex-shrink: 0; margin-top: 2px;
    }
    .message.user .message-avatar {
      background: var(--accent-glow); border: 1px solid var(--border-active);
    }
    .message.assistant .message-avatar {
      background: linear-gradient(135deg, rgba(52,211,153,0.15), rgba(99,143,255,0.15));
      border: 1px solid rgba(52,211,153,0.2);
    }
    .message-body { flex: 1; min-width: 0; }
    .message-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .message-name { font-size: 13px; font-weight: 600; }
    .message-time { font-size: 11px; color: var(--text-muted); }
    .message-content {
      font-size: 14px; line-height: 1.7; padding: 12px 16px;
      border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);
      white-space: pre-wrap;
    }
    .message.user .message-content {
      background: rgba(99,143,255,0.08); border-color: var(--border-active);
    }
    .message.assistant .message-content {
      background: rgba(30,41,59,0.6);
    }

    .guardrail-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11px; padding: 3px 10px; border-radius: 100px; margin-top: 8px;
    }
    .guardrail-badge.blocked {
      background: var(--danger-bg); border: 1px solid rgba(248,113,113,0.2); color: var(--danger);
    }
    .guardrail-badge.safe {
      background: var(--success-bg); border: 1px solid rgba(52,211,153,0.2); color: var(--success);
    }
    .guardrail-badge.masked {
      background: var(--warning-bg); border: 1px solid rgba(251,191,36,0.2); color: var(--warning);
    }

    .typing-indicator { display: flex; gap: 5px; padding: 12px 16px; }
    .typing-indicator span {
      width: 7px; height: 7px; background: var(--text-muted);
      border-radius: 50%; animation: typing 1.2s infinite;
    }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

    .input-area {
      padding: 16px 32px 20px; border-top: 1px solid var(--border-subtle);
      background: var(--bg-secondary);
    }
    .input-wrapper {
      display: flex; align-items: flex-end; gap: 10px;
      background: var(--bg-input); border: 1px solid var(--border-subtle);
      border-radius: var(--radius); padding: 6px 8px 6px 16px; transition: var(--transition);
    }
    .input-wrapper.focused {
      border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .input-wrapper textarea {
      flex: 1; background: none; border: none; color: var(--text-primary);
      font: 400 14px var(--font-sans); resize: none; outline: none;
      max-height: 120px; line-height: 1.5; padding: 8px 0;
    }
    .input-wrapper textarea::placeholder { color: var(--text-muted); }
    .send-btn {
      width: 38px; height: 38px; border-radius: var(--radius-xs); border: none;
      background: var(--accent); color: #fff; font-size: 16px;
      cursor: pointer; transition: var(--transition);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .send-btn:hover { background: var(--accent-bright); box-shadow: 0 2px 12px rgba(99,143,255,0.4); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .input-hint { font-size: 11px; color: var(--text-muted); margin-top: 6px; padding-left: 4px; }

    .copy-btn {
      margin-left: auto; font: 400 11px var(--font-sans);
      color: var(--text-muted); background: none; border: 1px solid var(--border-subtle);
      padding: 2px 8px; border-radius: 100px; cursor: pointer; transition: var(--transition);
    }
    .copy-btn:hover { color: var(--accent-bright); border-color: var(--accent); }
  `],
})
export class ChatComponent {
  @Output() hitsChanged = new EventEmitter<SearchHit[]>();
  @ViewChild('chatScroll') chatScrollEl!: ElementRef<HTMLDivElement>;
  @ViewChild('inputEl') inputEl!: ElementRef<HTMLTextAreaElement>;

  messages: ChatMessage[] = [];
  inputText = '';
  isLoading = false;
  inputFocused = false;
  copiedIndex: number | null = null;

  quickQuestions = [
    'プロジェクトの目的は？',
    '技術スタックを教えて',
    'セキュリティポリシーは？',
  ];

  constructor(
    private ragApi: RagApiService,
    private guardrails: GuardrailsService,
    private auditLog: AuditLogService,
  ) {}

  submitQuick(q: string): void {
    this.inputText = q;
    this.send();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading) return;

    // PII マスク
    const { text: safeText, wasMasked } = this.guardrails.maskPii(text);

    // ユーザーメッセージ追加
    const userMsg: ChatMessage = {
      role: 'user',
      content: wasMasked ? safeText : text,
      masked: wasMasked,
      timestamp: new Date(),
    };
    this.messages.push(userMsg);
    this.inputText = '';
    this.isLoading = true;
    this.scrollToBottom();

    if (wasMasked) {
      this.auditLog.addEntry('pii_masked', { query: safeText });
    }

    // RAG API 呼び出し
    this.ragApi.ask(text).subscribe({
      next: (res) => {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: res.answer,
          hits: res.hits,
          blocked: res.blocked,
          timestamp: new Date(),
        };
        this.messages.push(assistantMsg);
        this.isLoading = false;
        this.hitsChanged.emit(res.hits);
        this.scrollToBottom();
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          content: 'エラーが発生しました。もう一度お試しください。',
          timestamp: new Date(),
        });
        this.isLoading = false;
      },
    });
  }

  copyMessage(content: string, index: number): void {
    navigator.clipboard.writeText(content).then(() => {
      this.copiedIndex = index;
      setTimeout(() => { this.copiedIndex = null; }, 2000);
    }).catch(() => {});
  }

  formatContent(content: string): string {
    // [出典: xxx] をバッジに変換
    return content.replace(
      /\[出典:\s*([^\]]+)\]/g,
      '<span class="citation-tag">📎 $1</span>'
    );
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.chatScrollEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
}
