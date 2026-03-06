"""簡易ガードレール：PII マスク / プロンプト注入検知 / 出力フィルタ."""
import re

# --- PII patterns (日本語＋英語) ---
_PII_PATTERNS = [
    (r"\b\d{3}-\d{4}-\d{4}\b", "[電話番号]"),          # 日本の電話番号
    (r"\b\d{3}-\d{2}-\d{4}\b", "[SSN]"),               # US SSN
    (r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[メール]"),
    (r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", "[カード番号]"),
]

def mask_pii(text: str) -> str:
    for pat, repl in _PII_PATTERNS:
        text = re.sub(pat, repl, text)
    return text

# --- Prompt injection detection ---
_INJECTION_KEYWORDS = [
    "ignore previous instructions",
    "ignore above",
    "system prompt",
    "you are now",
    "disregard",
    "前の指示を無視",
    "システムプロンプト",
]

def detect_injection(text: str) -> bool:
    low = text.lower()
    return any(kw in low for kw in _INJECTION_KEYWORDS)

# --- Output NG words ---
_NG_WORDS = ["会社の機密", "社外秘"]  # 例: 追加可能

def filter_output(text: str) -> str:
    cleaned = mask_pii(text)
    for ng in _NG_WORDS:
        cleaned = cleaned.replace(ng, "[NG]")
    return cleaned
