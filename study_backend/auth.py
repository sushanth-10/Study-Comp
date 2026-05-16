"""Authentication helpers."""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from functools import wraps
from urllib.parse import urlencode

import jwt
from fastapi import HTTPException, Request, status
from fastapi.responses import RedirectResponse
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.orm import Session

from study_backend.config import settings
from study_backend.models import User


COOKIE_NAME = "study_session"


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, digest = stored.split("$", 1)
    except ValueError:
        return False
    candidate = hash_password(password, salt).split("$", 1)[1]
    return hmac.compare_digest(candidate, digest)


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.full_name,
        "provider": user.provider,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=7)).timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session.") from exc


def get_current_user(request: Request, db: Session) -> User:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    payload = decode_access_token(token)
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    return user


def maybe_current_user(request: Request, db: Session) -> User | None:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    try:
        payload = decode_access_token(token)
    except HTTPException:
        return None
    return db.get(User, int(payload["sub"]))


def attach_session(response: RedirectResponse, user: User) -> None:
    token = create_access_token(user)
    response.set_cookie(
        COOKIE_NAME,
        token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=7 * 24 * 3600,
    )


def clear_session(response: RedirectResponse) -> None:
    response.delete_cookie(COOKIE_NAME)


def google_login_url() -> str:
    if not settings.google_client_id or not settings.google_redirect_uri:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured.")
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    return "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)


def upsert_google_user(db: Session, token_value: str) -> User:
    if not settings.google_client_id:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured.")
    info = id_token.verify_oauth2_token(
        token_value, google_requests.Request(), settings.google_client_id
    )
    email = (info.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google account email missing.")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            full_name=info.get("name") or email.split("@")[0].title(),
            avatar_url=info.get("picture") or "",
            provider="google",
            password_hash="",
        )
        db.add(user)
        db.flush()
    else:
        user.full_name = info.get("name") or user.full_name
        user.avatar_url = info.get("picture") or user.avatar_url
        user.provider = "google"
    return user
