"""FastAPI app serving the existing UI plus adaptive intelligence APIs."""
from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime, timedelta
from pathlib import Path
from typing import Callable

import uvicorn
from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from study_backend.ai_service import chat as ai_chat
from notes_service import delete_pdf, get_pdf_path, get_pdf_record, list_pdfs, save_pdf
from study_backend.auth import attach_session, clear_session, get_current_user, google_login_url, maybe_current_user, upsert_google_user, verify_password, hash_password
from study_backend.config import ROOT
from study_backend.database import Base, engine, get_db
from study_backend.models import MoodEntry, StudySession, User
from study_backend.schemas import AnalyticsUpdateRequest, ConceptMapRequest, FlashcardGenerateRequest, MoodUpdateRequest, QuizGenerateRequest, SmartNotesRequest, StudyPlanRequest
from study_backend.services.analytics import (
    compute_activity,
    compute_analytics_overview,
    compute_fatigue_analytics,
    compute_focus_analytics,
    compute_insights,
    compute_mastery_analytics,
    compute_notes_view,
    compute_overview,
    compute_performance_analytics,
    compute_recommendations,
    compute_streak_view,
    persist_analytics_artifacts,
)
from study_backend.services.bootstrap import ensure_seed_data
from study_backend.services.quiz import concept_map, generate_adaptive_quiz, generate_flashcards, generate_plan, record_quiz_outcome, smart_notes


app = FastAPI(title="Scholarly Adaptive Engine")
app.mount("/css", StaticFiles(directory=str(ROOT / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(ROOT / "js")), name="js")

PROTECTED_PAGES = {
    "/dashboard": "dashboard.html",
    "/analytics": "analytics.html",
    "/planner": "planner.html",
    "/focus": "focus.html",
    "/notes": "notes.html",
    "/streak": "streak.html",
    "/quiz": "quiz.html",
    "/ai": "AI_page.html",
    "/visual": "visual.html",
}
PUBLIC_PAGES = {"/login": "login.html", "/signup": "signup.html"}
RATE_BUCKETS: dict[str, deque] = defaultdict(deque)


def _page(path: str) -> FileResponse:
    return FileResponse(ROOT / path)


def _require_page_user(request: Request, db: Session) -> User:
    user = maybe_current_user(request, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_307_TEMPORARY_REDIRECT, headers={"Location": "/login"})
    ensure_seed_data(db, user)
    db.commit()
    return user


def _api_user(request: Request, db: Session = Depends(get_db)) -> User:
    user = get_current_user(request, db)
    ensure_seed_data(db, user)
    db.commit()
    return user


def _rate_limit(request: Request, user: User, limit: int = 30, per_minutes: int = 5) -> None:
    key = f"{user.id}:{request.url.path}"
    bucket = RATE_BUCKETS[key]
    now = datetime.utcnow()
    while bucket and bucket[0] < now - timedelta(minutes=per_minutes):
        bucket.popleft()
    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please slow down a little.")
    bucket.append(now)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    if exc.status_code == status.HTTP_307_TEMPORARY_REDIRECT and exc.headers and exc.headers.get("Location"):
        return RedirectResponse(exc.headers["Location"], status_code=307)
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code, headers=exc.headers)


@app.get("/")
def index(request: Request, db: Session = Depends(get_db)):
    return RedirectResponse("/dashboard" if maybe_current_user(request, db) else "/login")


@app.get("/login")
def login_page(request: Request, db: Session = Depends(get_db)):
    if maybe_current_user(request, db):
        return RedirectResponse("/dashboard")
    return _page(PUBLIC_PAGES["/login"])


@app.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == email.strip().lower()).first()
    if not user or not verify_password(password, user.password_hash):
        return RedirectResponse("/login", status_code=303)
    ensure_seed_data(db, user)
    db.commit()
    response = RedirectResponse("/dashboard", status_code=303)
    attach_session(response, user)
    return response


@app.get("/signup")
def signup_page(request: Request, db: Session = Depends(get_db)):
    if maybe_current_user(request, db):
        return RedirectResponse("/dashboard")
    return _page(PUBLIC_PAGES["/signup"])


@app.post("/signup")
def signup(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    email = email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        return RedirectResponse("/login", status_code=303)
    user = User(full_name=full_name.strip(), email=email, password_hash=hash_password(password), provider="local")
    db.add(user)
    db.flush()
    ensure_seed_data(db, user)
    db.commit()
    response = RedirectResponse("/dashboard", status_code=303)
    attach_session(response, user)
    return response


@app.get("/auth/google/login")
def auth_google_login():
    return RedirectResponse(google_login_url())


@app.post("/auth/google/callback")
def auth_google_callback(payload: dict, db: Session = Depends(get_db)):
    token_value = payload.get("credential") or payload.get("id_token")
    if not token_value:
        raise HTTPException(status_code=400, detail="Missing Google token.")
    user = upsert_google_user(db, token_value)
    ensure_seed_data(db, user)
    db.commit()
    response = RedirectResponse("/dashboard", status_code=303)
    attach_session(response, user)
    return response


@app.get("/logout")
def logout():
    response = RedirectResponse("/login", status_code=303)
    clear_session(response)
    return response


for route_path, page_name in PROTECTED_PAGES.items():

    def _make_handler(path: str = page_name) -> Callable:
        def handler(request: Request, db: Session = Depends(get_db)):
            _require_page_user(request, db)
            return _page(path)

        return handler

    app.get(route_path)(_make_handler())


@app.get("/api/session")
def session_info(user: User = Depends(_api_user)):
    return {"user": {"name": user.full_name, "email": user.email, "avatarUrl": user.avatar_url}}


@app.get("/api/dashboard/overview")
def dashboard_overview(user: User = Depends(_api_user), db: Session = Depends(get_db)):
    return compute_overview(db, user)


@app.get("/api/dashboard/activity")
def dashboard_activity(user: User = Depends(_api_user), db: Session = Depends(get_db)):
    return {"items": compute_activity(db, user)}


@app.get("/api/dashboard/insights")
def dashboard_insights(user: User = Depends(_api_user), db: Session = Depends(get_db)):
    return {"items": compute_insights(db, user)}


@app.get("/api/focus/analytics")
def focus_analytics(range: str = Query(default="weekly"), user: User = Depends(_api_user), db: Session = Depends(get_db)):
    return compute_focus_analytics(db, user, range)


@app.get("/api/streak")
def streak_data(user: User = Depends(_api_user), db: Session = Depends(get_db)):
    return compute_streak_view(db, user)


@app.get("/api/notes")
def notes_data(q: str = "", user: User = Depends(_api_user), db: Session = Depends(get_db)):
    return compute_notes_view(db, user, q)


@app.get("/api/notes/list")
def notes_pdf_list(q: str = "", user: User = Depends(_api_user)):
    return {"pdfs": list_pdfs(user.email, q)}


@app.post("/api/notes/upload")
async def notes_pdf_upload(file: UploadFile = File(...), user: User = Depends(_api_user)):
    class UploadAdapter:
        def __init__(self, upload: UploadFile):
            self.filename = upload.filename
            self.content_type = upload.content_type
            self._upload = upload

        def read(self):
            return self._upload.file.read()

    try:
        record = save_pdf(user.email, UploadAdapter(file))
        return JSONResponse({"pdf": record}, status_code=201)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        await file.close()


@app.get("/api/notes/pdf/{pdf_id}")
def notes_pdf_view(pdf_id: str, user: User = Depends(_api_user)):
    record = get_pdf_record(pdf_id, user.email)
    path = get_pdf_path(pdf_id, user.email)
    if not record or not path:
        raise HTTPException(status_code=404, detail="PDF not found.")
    return FileResponse(path, media_type="application/pdf", filename=record.get("filename", "document.pdf"))


@app.delete("/api/notes/{pdf_id}")
def notes_pdf_delete(pdf_id: str, user: User = Depends(_api_user)):
    if delete_pdf(pdf_id, user.email):
        return {"ok": True}
    raise HTTPException(status_code=404, detail="PDF not found.")


@app.post("/api/quiz/generate")
def quiz_generate(payload: QuizGenerateRequest, request: Request, user: User = Depends(_api_user), db: Session = Depends(get_db)):
    _rate_limit(request, user, limit=20, per_minutes=5)
    return generate_adaptive_quiz(db, user, payload)


@app.post("/api/ai/chat")
def ai_chat_route(payload: dict, request: Request, user: User = Depends(_api_user)):
    _rate_limit(request, user, limit=25, per_minutes=5)
    message = (payload.get("message") or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required.")
    return ai_chat(message)


@app.post("/api/ai/scan-file")
async def ai_scan_file(file: UploadFile = File(...), user: User = Depends(_api_user)):
    from ai_service import scan_file_for_topic
    try:
        content = await file.read()
        mime_type = file.content_type or "application/octet-stream"
        context_text, topic = scan_file_for_topic(content, mime_type)
        return {"topic": topic, "context": context_text}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    finally:
        await file.close()


@app.post("/api/analytics/update")
def analytics_update(payload: AnalyticsUpdateRequest, request: Request, user: User = Depends(_api_user), db: Session = Depends(get_db)):
    _rate_limit(request, user, limit=50, per_minutes=5)
    created_session = None
    created_quiz = None
    if payload.eventType == "quiz_result":
        created_quiz = record_quiz_outcome(
            db,
            user,
            topic=payload.topic,
            subject=payload.subject,
            difficulty=payload.metadata.get("difficulty", "moderate"),
            score=payload.quizScore or 0,
            total=payload.totalQuestions or 10,
            confidence=payload.confidenceAvg or 0.7,
            response_time_avg=payload.responseTimeAvg or 18,
            metadata=payload.metadata,
        )
    else:
        now = payload.timestamp or datetime.utcnow()
        created_session = StudySession(
            user_id=user.id,
            subject=payload.subject,
            topic=payload.topic,
            duration_minutes=payload.durationMinutes,
            focus_score=payload.focusScore,
            productivity_score=payload.productivityScore,
            fatigue_score=payload.fatigueScore,
            interruptions=payload.interruptions,
            completed=True,
            session_type=payload.eventType,
            started_at=now - timedelta(minutes=payload.durationMinutes),
            ended_at=now,
            metadata_json={
                **payload.metadata,
                "idleSeconds": payload.idleSeconds,
                "tabSwitches": payload.tabSwitches,
                "completionRate": payload.completionRate,
                "retryFrequency": payload.retryFrequency,
                "unansweredCount": payload.unansweredCount,
            },
        )
        db.add(created_session)
    db.flush()
    persist_analytics_artifacts(
        db,
        user,
        session=created_session,
        quiz=created_quiz,
        source_payload={
            **payload.metadata,
            "completionRate": payload.completionRate,
            "retryFrequency": payload.retryFrequency,
            "idleSeconds": payload.idleSeconds,
            "tabSwitches": payload.tabSwitches,
            "unansweredCount": payload.unansweredCount,
            "difficulty": payload.metadata.get("difficulty", "moderate"),
        },
    )
    db.commit()
    return {
        "ok": True,
        "overview": compute_overview(db, user).model_dump(),
        "analytics": compute_analytics_overview(db, user, "weekly").model_dump(),
    }


@app.post("/api/analytics/session/update")
def analytics_session_update(payload: AnalyticsUpdateRequest, request: Request, user: User = Depends(_api_user), db: Session = Depends(get_db)):
    return analytics_update(payload, request, user, db)


@app.get("/api/analytics/overview")
@app.get("/analytics/overview")
def analytics_overview(range: str = Query(default="weekly"), user: User = Depends(_api_user), db: Session = Depends(get_db)):
    return compute_analytics_overview(db, user, range)


@app.get("/api/analytics/performance")
@app.get("/analytics/performance")
def analytics_performance(range: str = Query(default="weekly"), user: User = Depends(_api_user), db: Session = Depends(get_db)):
    return compute_performance_analytics(db, user, range)


@app.get("/api/analytics/focus")
@app.get("/analytics/focus")
def analytics_focus(range: str = Query(default="weekly"), user: User = Depends(_api_user), db: Session = Depends(get_db)):
    return compute_focus_analytics(db, user, range)


@app.get("/api/analytics/mastery")
@app.get("/analytics/mastery")
def analytics_mastery(range: str = Query(default="weekly"), user: User = Depends(_api_user), db: Session = Depends(get_db)):
    return compute_mastery_analytics(db, user, range)


@app.get("/api/analytics/fatigue")
@app.get("/analytics/fatigue")
def analytics_fatigue(range: str = Query(default="weekly"), user: User = Depends(_api_user), db: Session = Depends(get_db)):
    return compute_fatigue_analytics(db, user, range)


@app.get("/api/analytics/streaks")
@app.get("/analytics/streaks")
def analytics_streaks(user: User = Depends(_api_user), db: Session = Depends(get_db)):
    return compute_streak_view(db, user)


@app.get("/api/analytics/recommendations")
@app.get("/analytics/recommendations")
def analytics_recommendations(range: str = Query(default="weekly"), user: User = Depends(_api_user), db: Session = Depends(get_db)):
    return compute_recommendations(db, user, range)


@app.post("/api/planner/generate")
def planner_generate(payload: StudyPlanRequest, request: Request, user: User = Depends(_api_user), db: Session = Depends(get_db)):
    _rate_limit(request, user, limit=12, per_minutes=10)
    plan = generate_plan(db, user, payload)
    db.commit()
    return plan


@app.post("/api/flashcards/generate")
def flashcards_generate(payload: FlashcardGenerateRequest, request: Request, user: User = Depends(_api_user), db: Session = Depends(get_db)):
    _rate_limit(request, user, limit=20, per_minutes=10)
    result = generate_flashcards(db, user, payload)
    db.commit()
    return result


@app.post("/api/mood/update")
def mood_update(payload: MoodUpdateRequest, request: Request, user: User = Depends(_api_user), db: Session = Depends(get_db)):
    _rate_limit(request, user, limit=40, per_minutes=10)
    db.add(MoodEntry(user_id=user.id, **payload.model_dump()))
    db.commit()
    return {"ok": True, "insights": [item.model_dump() for item in compute_insights(db, user)]}


@app.post("/api/notes/smart")
def notes_smart(payload: SmartNotesRequest, request: Request, user: User = Depends(_api_user), db: Session = Depends(get_db)):
    _rate_limit(request, user, limit=10, per_minutes=10)
    result = smart_notes(db, user, payload)
    db.commit()
    return result


@app.post("/api/concept-map/generate")
def concept_map_generate(payload: ConceptMapRequest, request: Request, user: User = Depends(_api_user)):
    _rate_limit(request, user, limit=10, per_minutes=10)
    return concept_map(payload.topic, payload.notes)


def run() -> None:
    port = 8000
    print(f"\n  Scholarly adaptive engine running at http://127.0.0.1:{port}\n")
    uvicorn.run("study_backend.app:app", host="0.0.0.0", port=port, reload=False)
