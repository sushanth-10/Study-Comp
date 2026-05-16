"""Application configuration."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")


@dataclass(slots=True)
class Settings:
    app_name: str = "Scholarly Adaptive Engine"
    secret_key: str = os.environ.get("SECRET_KEY", "scholarly-dev-secret-change-me")
    database_url: str = os.environ.get("DATABASE_URL", f"sqlite:///{ROOT / 'scholarly.db'}")
    openrouter_api_key: str = os.environ.get("OPENROUTER_API_KEY", "").strip()
    openrouter_base_url: str = os.environ.get(
        "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions"
    )
    openrouter_site_url: str = os.environ.get("OPENROUTER_SITE_URL", "http://localhost:8000")
    openrouter_app_name: str = os.environ.get("OPENROUTER_APP_NAME", "Scholarly")
    google_client_id: str = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
    google_client_secret: str = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()
    google_redirect_uri: str = os.environ.get(
        "GOOGLE_REDIRECT_URI", "http://127.0.0.1:8000/auth/google/callback"
    )
    default_models: tuple[str, ...] = (
        "google/gemini-2.0-flash-001",
        "deepseek/deepseek-chat-v3-0324",
        "meta-llama/llama-3.3-70b-instruct",
    )


settings = Settings()
