"""docs/ 配下の PDF / Markdown をテキストとして読み込む."""
import os
from pypdf import PdfReader

def load_documents(docs_dir: str) -> list[dict]:
    """Return list of {"source": filename, "text": full_text}."""
    docs = []
    for fname in sorted(os.listdir(docs_dir)):
        path = os.path.join(docs_dir, fname)
        if fname.lower().endswith(".pdf"):
            reader = PdfReader(path)
            text = "\n".join(p.extract_text() or "" for p in reader.pages)
        elif fname.lower().endswith((".md", ".txt")):
            with open(path, encoding="utf-8") as f:
                text = f.read()
        else:
            continue
        if text.strip():
            docs.append({"source": fname, "text": text})
    return docs
