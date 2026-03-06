/** チャットメッセージ */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hits?: SearchHit[];
  blocked?: boolean;
  masked?: boolean;
}

/** ベクトル検索ヒット */
export interface SearchHit {
  text: string;
  source: string;
  chunk_index: number;
  distance: number;
}

/** RAG API レスポンス */
export interface RagResponse {
  answer: string;
  hits: SearchHit[];
  blocked: boolean;
}

/** 監査ログエントリ */
export interface AuditLogEntry {
  timestamp: string;
  event: 'qa' | 'blocked_injection' | 'ingest' | 'pii_masked';
  query?: string;
  model?: string;
  sources?: string[];
  answer_length?: number;
  files?: string[];
  total_chunks?: number;
}

/** 評価結果 */
export interface EvalResult {
  question: string;
  answered: boolean;
  has_citation: boolean;
  keyword_hit_rate: number;
  latency_sec: number;
  sources: string;
  answer_preview: string;
}

/** 評価サマリ */
export interface EvalSummary {
  total: number;
  answered_rate: number;
  citation_rate: number;
  avg_keyword_hit: number;
  avg_latency: number;
}

/** ガードレール状態 */
export interface GuardrailStatus {
  pii_mask: boolean;
  injection_detection: boolean;
  output_filter: boolean;
}

/** PII マスク結果 */
export interface PiiMaskResult {
  text: string;
  wasMasked: boolean;
}

/** ドキュメント情報 */
export interface DocumentInfo {
  name: string;
  chunks: number;
  size?: string;
}

/** 右パネルのタブ種別 */
export type PanelTab = 'search' | 'logs' | 'eval';
