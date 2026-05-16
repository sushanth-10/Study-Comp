"""PDF storage for the Notes library."""
import hashlib
import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = ROOT / "storage" / "pdfs"
INDEX_PATH = ROOT / "storage" / "notes_index.json"
MAX_BYTES = 25 * 1024 * 1024  # 25 MB per file


def _secure_filename(name: str) -> str:
    cleaned = re.sub(r"[^\w.\- ]+", "", name or "").strip().replace(" ", "_")
    return cleaned[:180] or "document.pdf"


def _user_key(email: str) -> str:
    return hashlib.sha256((email or "anonymous").lower().encode()).hexdigest()[:16]


def _ensure_dirs() -> None:
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def _load_index() -> list[dict]:
    if not INDEX_PATH.exists():
        return []
    try:
        data = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def _save_index(items: list[dict]) -> None:
    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    INDEX_PATH.write_text(json.dumps(items, indent=2), encoding="utf-8")


def _format_size(num: int) -> str:
    if num < 1024:
        return f"{num} B"
    if num < 1024 * 1024:
        return f"{num / 1024:.1f} KB"
    return f"{num / (1024 * 1024):.1f} MB"


def list_pdfs(user_email: str, query: str = "") -> list[dict]:
    key = _user_key(user_email)
    q = (query or "").strip().lower()
    items = [i for i in _load_index() if i.get("user") == key]
    items.sort(key=lambda x: x.get("uploaded_at", ""), reverse=True)
    if q:
        items = [i for i in items if q in i.get("name", "").lower()]
    for item in items:
        item["size_label"] = _format_size(int(item.get("size", 0)))
    return items


def get_pdf_record(pdf_id: str, user_email: str) -> dict | None:
    key = _user_key(user_email)
    for item in _load_index():
        if item.get("id") == pdf_id and item.get("user") == key:
            return item
    return None


def get_pdf_path(pdf_id: str, user_email: str) -> Path | None:
    record = get_pdf_record(pdf_id, user_email)
    if not record:
        return None
    path = STORAGE_DIR / record["stored_name"]
    return path if path.is_file() else None


def save_pdf(user_email: str, file_storage) -> dict:
    if not file_storage or not file_storage.filename:
        raise ValueError("No file provided.")

    original = file_storage.filename.strip()
    if not original.lower().endswith(".pdf"):
        raise ValueError("Only PDF files are allowed.")

    mime = (file_storage.content_type or "").lower()
    if mime and mime not in ("application/pdf", "application/x-pdf", "binary/octet-stream"):
        raise ValueError("File must be a PDF.")

    data = file_storage.read()
    if not data:
        raise ValueError("File is empty.")
    if len(data) > MAX_BYTES:
        raise ValueError(f"File too large. Maximum size is {_format_size(MAX_BYTES)}.")

    if data[:4] != b"%PDF":
        raise ValueError("Invalid PDF file.")

    _ensure_dirs()
    pdf_id = str(uuid.uuid4())
    safe = _secure_filename(original)
    if not safe.lower().endswith(".pdf"):
        safe += ".pdf"
    stored_name = f"{pdf_id}_{safe}"
    path = STORAGE_DIR / stored_name
    path.write_bytes(data)

    record = {
        "id": pdf_id,
        "user": _user_key(user_email),
        "name": re.sub(r"\.pdf$", "", original, flags=re.I) or original,
        "filename": original,
        "stored_name": stored_name,
        "size": len(data),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }

    items = _load_index()
    items.append(record)
    _save_index(items)

    record["size_label"] = _format_size(record["size"])
    return record


def delete_pdf(pdf_id: str, user_email: str) -> bool:
    record = get_pdf_record(pdf_id, user_email)
    if not record:
        return False

    path = STORAGE_DIR / record["stored_name"]
    if path.is_file():
        path.unlink()

    items = [i for i in _load_index() if i.get("id") != pdf_id]
    _save_index(items)
    return True
