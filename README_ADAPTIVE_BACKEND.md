# Scholarly Adaptive Backend

This repo now runs a FastAPI-based adaptive study engine behind the existing HTML UI.

## Run

```powershell
python app.py
```

The app serves at `http://127.0.0.1:8000`.

## Environment

Copy `.env.example` to `.env` and set the values you need:

- `SECRET_KEY`
- `DATABASE_URL`
- `OPENROUTER_API_KEY`
- `OPENAI_API_KEY` and `OPENAI_MODEL` for legacy assistant/quiz fallbacks
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

## Core APIs

- `GET /api/dashboard/overview`
- `GET /api/dashboard/activity`
- `GET /api/dashboard/insights`
- `POST /api/quiz/generate`
- `POST /api/analytics/update`
- `POST /api/planner/generate`
- `POST /api/flashcards/generate`
- `POST /api/mood/update`
- `GET /api/focus/analytics`
- `GET /api/streak`
- `GET /api/notes`
- `POST /api/notes/smart`
- `POST /api/concept-map/generate`
- `POST /api/ai/chat`

## Backend layout

- `study_backend/app.py`: FastAPI app, auth routes, protected pages, API endpoints, rate limiting
- `study_backend/models.py`: SQLAlchemy models for users, sessions, quizzes, flashcards, moods, notes, plans, adaptive state
- `study_backend/services/analytics.py`: dashboard, streak, focus, notes, and insight calculations
- `study_backend/services/openrouter.py`: OpenRouter orchestration with retries, caching, and fallback behavior
- `study_backend/services/quiz.py`: adaptive quiz, flashcard, planner, smart-notes, and concept-map services
- `supabase/schema.sql`: Supabase/PostgreSQL schema
- `frontend-integration/`: TypeScript API client, Zustand store, and React Query hook examples for future Next.js 15 integration

## Notes

- The current repo UI is still static HTML/JS, but it now consumes live APIs for dashboard, focus, notes, streak, and quiz telemetry.
- The backend seeds realistic demo telemetry for first-time users so the dashboard feels populated immediately after signup.
