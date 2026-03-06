"""監査ログを JSONL 形式で logs/ に書き出す."""
import json, os, datetime
from rag.config import LOGS_DIR

os.makedirs(LOGS_DIR, exist_ok=True)
_LOG_PATH = os.path.join(LOGS_DIR, "audit.jsonl")

def log_event(event_type: str, **kwargs):
    entry = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "event": event_type,
        **kwargs,
    }
    with open(_LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
