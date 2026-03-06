"""共通設定を .env から読み込む."""
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
EMBED_MODEL = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "512"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "64"))
TOP_K = int(os.getenv("TOP_K", "3"))

CHROMA_DIR = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
DOCS_DIR = os.path.join(os.path.dirname(__file__), "..", "docs")
LOGS_DIR = os.path.join(os.path.dirname(__file__), "..", "logs")
