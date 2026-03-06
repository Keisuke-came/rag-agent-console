import { Injectable } from '@angular/core';
import { PiiMaskResult } from '../models/interfaces';

/** 入出力ガードレールサービス */
@Injectable({ providedIn: 'root' })
export class GuardrailsService {

  /** プロンプトインジェクション検知キーワード（日英両対応） */
  private readonly injectionKeywords: string[] = [
    'ignore previous instructions',
    'ignore above',
    'system prompt',
    'you are now',
    'disregard',
    '前の指示を無視',
    'システムプロンプト',
    '上記を全て忘れ',
  ];

  /** PII 正規表現パターン */
  private readonly piiPatterns: { regex: RegExp; replacement: string }[] = [
    { regex: /\b\d{3}-\d{4}-\d{4}\b/g, replacement: '[電話番号]' },
    { regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' },
    { regex: /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, replacement: '[メール]' },
    { regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[カード番号]' },
  ];

  /** NG ワード */
  private readonly ngWords: string[] = ['会社の機密', '社外秘'];

  /** プロンプトインジェクション検知 */
  detectInjection(text: string): boolean {
    const lower = text.toLowerCase();
    return this.injectionKeywords.some((kw) => lower.includes(kw));
  }

  /** 入力の PII マスク */
  maskPii(text: string): PiiMaskResult {
    let masked = text;
    let wasMasked = false;

    for (const pattern of this.piiPatterns) {
      // RegExp は stateful なので毎回リセット
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      if (regex.test(masked)) {
        wasMasked = true;
      }
      masked = masked.replace(
        new RegExp(pattern.regex.source, pattern.regex.flags),
        pattern.replacement
      );
    }

    return { text: masked, wasMasked };
  }

  /** 出力フィルタ（PII + NG ワード） */
  filterOutput(text: string): string {
    let filtered = this.maskPii(text).text;
    for (const ng of this.ngWords) {
      filtered = filtered.replaceAll(ng, '[NG]');
    }
    return filtered;
  }
}
