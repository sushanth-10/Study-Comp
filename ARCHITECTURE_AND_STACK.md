# 📊 SCHOLARLY STUDY COMPANION — TECHNOLOGY STACK & ARCHITECTURE

## Technology Stack

### Frontend
```
├─ HTML5 (8 pages)
├─ CSS3 (desktop.css)
├─ JavaScript (Vanilla, no build system)
└─ LocalStorage/Session for state
```

### Backend
```
├─ Framework: Flask 2.3.3
├─ Server: Gunicorn (production) / Flask dev (local)
├─ Language: Python 3.10+
└─ Port: 5000
```

### Database
```
Current (Development):
├─ SQLite (scholarly.db)
└─ Simple session-based (no ORM used)

Production-Ready (Recommended):
├─ PostgreSQL (via Supabase)
├─ SQLAlchemy ORM (defined, not active)
└─ Full schema in supabase/schema.sql
```

### AI/External Services
```
├─ OpenAI API (optional, for better responses)
├─ OpenRouter API (optional, advanced models)
├─ Google OAuth (optional, authentication)
├─ DuckDuckGo Search (required, web search)
├─ Wikipedia (required, knowledge fallback)
└─ PyPDF2 (required, PDF parsing)
```

### Deployment
```
Recommended:
├─ Backend: Render.com (Python)
├─ Frontend: Same as backend (served by Flask) or Vercel
├─ Database: SQLite (free, 1GB) or Supabase PostgreSQL (free, 500MB)
└─ Cost: $0/month

Alternative:
├─ Backend: Railway.app
├─ Frontend: Netlify or GitHub Pages
└─ Cost: $0/month + $5 credits
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   USER'S BROWSER                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  HTML (8 Pages)                                      │  │
│  │  • login.html, signup.html                           │  │
│  │  • dashboard.html, analytics.html, planner.html     │  │
│  │  • focus.html, notes.html, streak.html, quiz.html   │  │
│  │  • AI_page.html, visual.html                         │  │
│  └────────────────────────────────────────────────────────┘
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CSS (Single File: desktop.css)                      │  │
│  │  • Responsive design                                 │  │
│  │  • Dark/Light mode (optional)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  JavaScript (Vanilla, 11 files)                      │  │
│  │  • ai-assistant.js, analytics-page.js                │  │
│  │  • app.js, dashboard.js, focus-session.js            │  │
│  │  • notes-page.js, notes.js, planner.js              │  │
│  │  • quiz.js, streak-page.js                           │  │
│  │  • API calls via fetch()                             │  │
│  │  • LocalStorage for persistence                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Session Management                                  │  │
│  │  • Flask sessions (server-side)                      │  │
│  │  • Session cookies (httponly, secure)                │  │
│  │  • 30-day expiry                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
                    HTTPS │
                         ▼
        ┌─────────────────────────────────┐
        │  RENDER.COM                     │
        │  (Python Flask Backend)         │
        │  Port: 5000                     │
        │  Workers: 4 (Gunicorn)          │
        │  Memory: 512MB                  │
        └─────────────────────────────────┘
                  │
          ┌───────┼───────┐
          │       │       │
          ▼       ▼       ▼
     ┌─────────────────────────────┐
     │  API ROUTES                 │
     ├─────────────────────────────┤
     │  Authentication             │
     │  • POST /login              │
     │  • POST /signup             │
     │  • GET /logout              │
     │                             │
     │  Protected Pages            │
     │  • GET /dashboard           │
     │  • GET /analytics           │
     │  • GET /planner             │
     │  • GET /focus               │
     │  • GET /notes               │
     │  • GET /streak              │
     │  • GET /quiz                │
     │  • GET /ai                  │
     │                             │
     │  API Endpoints              │
     │  • POST /api/ai/chat        │
     │  • POST /api/quiz/generate  │
     │  • POST /api/notes/upload   │
     │                             │
     │  Static Files               │
     │  • GET /css/*               │
     │  • GET /js/*                │
     │  • GET /                    │
     └─────────────────────────────┘
          │
    ┌─────┴──────┐
    ▼            ▼
┌────────────────────────────┐
│  SERVICE MODULES           │
├────────────────────────────┤
│  ai_service.py             │
│  • chat(message)           │
│  • Intent detection        │
│  • OpenAI fallback         │
│  • Wikipedia search        │
│  • YouTube suggestions     │
│  • DuckDuckGo search       │
│                            │
│  quiz_service.py           │
│  • generate_quiz()         │
│  • Question generation     │
│  • Difficulty levels       │
│  • Multiple choice         │
│  • Wikipedia source        │
│                            │
│  notes_service.py          │
│  • PDF upload/save         │
│  • PDF extraction          │
│  • File management         │
└────────────────────────────┘
    │
    ▼
┌────────────────────────────────┐
│  SESSION MANAGEMENT            │
├────────────────────────────────┤
│  Flask Sessions                │
│  • User email (session)        │
│  • User name (session)         │
│  • Login state (session)       │
│  • Timeout: 30 days            │
│  • Storage: Server-side        │
└────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│  DATABASE (Optional)                   │
├────────────────────────────────────────┤
│  SQLite (Development)                  │
│  • scholarly.db (1GB max)              │
│  • File-based, ephemeral on Render    │
│                                        │
│  PostgreSQL via Supabase (Production) │
│  • Persistent storage                 │
│  • Scalable to 10k+ users            │
│  • Free tier: 500MB                  │
│                                        │
│  Schema:                              │
│  • users (email, password_hash)       │
│  • study_sessions (topic, duration)   │
│  • quizzes (scores, questions)        │
│  • flashcards (Q&A pairs)             │
│  • mood_entries (user feedback)       │
│  • analytics_snapshots (metrics)      │
│  • recommendations (personalized)     │
│  • streaks (user engagement)          │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│  EXTERNAL APIs                         │
├────────────────────────────────────────┤
│  OpenAI (Optional)                     │
│  • gpt-4o-mini (chat)                  │
│  • gpt-3.5-turbo (fast)                │
│  • Usage: AI responses, quiz gen       │
│  • Cost: $0.05-0.15 per 1K tokens     │
│                                        │
│  OpenRouter (Optional)                 │
│  • Meta Llama 3.3 (70B)               │
│  • Google Gemini 2.0 Flash            │
│  • DeepSeek Chat v3                   │
│  • Usage: Advanced AI features        │
│                                        │
│  Google OAuth (Optional)               │
│  • Social login                        │
│  • Profile data                        │
│                                        │
│  DuckDuckGo Search (Required)         │
│  • Web search integration              │
│  • No API key needed                   │
│                                        │
│  Wikipedia (Required)                 │
│  • Knowledge source                    │
│  • Quiz generation                     │
│  • No API key needed                   │
└────────────────────────────────────────┘
```

---

## Data Flow Diagram

### User Login Flow
```
1. User enters email/password on login.html
   └─► Send POST /login (form data)
       
2. Flask app receives request
   └─► Check users.json for email
       └─► If exists: verify password hash (Fix #2)
           └─► If valid: create session
               └─► Set session["logged_in"] = True
               └─► Set session["email"] = email
               └─► Redirect to /dashboard
           └─► If invalid: return 401, reload login page
       └─► If not exists: return 401, show error

3. Browser stores session cookie
   └─► httpOnly, Secure, SameSite=Lax
   └─► Sent with every request
```

### AI Chat Flow
```
1. User types message in AI_page.html
   └─► Send POST /api/ai/chat with message

2. Flask app processes request
   └─► Check session (must be logged in)
   └─► Parse message with ai_service.py
       └─► Detect intent (explain, search, youtube, plan)
       └─► If explain: use OpenAI or Wikipedia fallback
       └─► If search: use DuckDuckGo Search
       └─► If youtube: format response with YouTube hints
       └─► If plan: generate study plan
   └─► Return JSON response

3. JavaScript receives response
   └─► Display message in chat UI
   └─► Save to localStorage
   └─► Animate typing effect
```

### Quiz Generation Flow
```
1. User selects topic/difficulty on quiz.html
   └─► Send POST /api/quiz/generate with topic

2. Flask app processes request
   └─► quiz_service.py generates quiz
       └─► Fetch Wikipedia page for topic
       └─► Extract sentences (50-280 chars each)
       └─► For each sentence:
           └─► Extract main answer
           └─► Generate 3 distractors
           └─► Create multiple choice question
       └─► Shuffle answers
       └─► Return JSON with 10-30 questions

3. JavaScript displays quiz
   └─► Show one question at a time
   └─► Track user answers
   └─► Calculate score
   └─► Show results with explanations
```

---

## Deployment Architecture

### Option 1: Render.com (Recommended)
```
┌──────────────────────────────────────┐
│  GitHub Repository                   │
│  Study-Comp with all files          │
│  └─ requirements-prod.txt            │
│  └─ Procfile                         │
│  └─ runtime.txt                      │
│  └─ Dockerfile.prod                  │
└──────────────────┬───────────────────┘
                   │ GitHub Push
                   ▼
        ┌──────────────────────┐
        │  Render.com          │
        │  ┌────────────────┐  │
        │  │ Python Runtime │  │
        │  │ 3.11.7         │  │
        │  └────────────────┘  │
        │  ┌────────────────┐  │
        │  │ Build           │  │
        │  │ pip install ... │  │
        │  └────────────────┘  │
        │  ┌────────────────┐  │
        │  │ Start           │  │
        │  │ gunicorn ...    │  │
        │  └────────────────┘  │
        │                      │
        │ URL: onrender.com    │
        │ Always-on: ✅       │
        │ Cost: $0/mo         │
        └──────────────────────┘
              │
              ▼
    ┌─────────────────────────────┐
    │  Supabase PostgreSQL        │
    │  (if using for persistence) │
    │                             │
    │  URL: supabase.co           │
    │  Storage: 500MB free        │
    │  Cost: $0/mo               │
    └─────────────────────────────┘
```

### Option 2: Docker Compose (Local/VPS)
```
┌─────────────────────────────────────┐
│  Your VPS / Server                  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Docker Compose              │  │
│  │  ┌──────────────┐            │  │
│  │  │  PostgreSQL  │            │  │
│  │  │  Port: 5432  │            │  │
│  │  └──────────────┘            │  │
│  │  ┌──────────────┐            │  │
│  │  │  Flask App   │            │  │
│  │  │  Port: 5000  │            │  │
│  │  │  Gunicorn x4 │            │  │
│  │  └──────────────┘            │  │
│  │  ┌──────────────┐            │  │
│  │  │  Nginx       │            │  │
│  │  │  Port: 80/443│            │  │
│  │  └──────────────┘            │  │
│  └──────────────────────────────┘  │
│                                     │
│  Cost: $3-20/mo (depending on VPS)  │
└─────────────────────────────────────┘
```

---

## File Structure Overview

```
Study-Comp/
│
├── Frontend (Public)
│   ├── *.html (8 pages) .......................... Served by Flask
│   ├── css/desktop.css ........................... Main stylesheet
│   ├── js/*.js (11 files) ........................ Vanilla JavaScript
│   └── frontend-integration/ ..................... TypeScript types
│
├── Backend (Flask)
│   ├── app.py ................................... Main Flask application
│   ├── ai_service.py ............................ AI chat logic
│   ├── quiz_service.py .......................... Quiz generation
│   ├── notes_service.py ......................... PDF handling
│   └── requirements-prod.txt ..................... Production dependencies
│
├── Database
│   ├── scholarly.db ............................. SQLite (development)
│   ├── users.json ............................... Simple user storage
│   └── supabase/schema.sql ...................... PostgreSQL schema
│
├── Backend Alternative (FastAPI - Not Active)
│   └── study_backend/
│       ├── app.py ............................... FastAPI application
│       ├── models.py ............................ SQLAlchemy ORM
│       ├── auth.py .............................. Authentication
│       ├── database.py .......................... DB connection
│       ├── config.py ............................ Configuration
│       ├── schemas.py ........................... Pydantic models
│       └── services/
│           ├── analytics.py ..................... Analytics logic
│           ├── quiz.py ......................... Quiz generation
│           └── bootstrap.py ..................... Seed data
│
├── Docker
│   ├── Dockerfile ............................... Dev container
│   ├── Dockerfile.prod .......................... Production container
│   ├── docker-compose.yml ....................... Local dev setup
│   └── docker-compose.prod.yml .................. Production setup
│
├── Deployment Config
│   ├── Procfile ................................. Heroku/Render
│   ├── runtime.txt .............................. Python version
│   ├── render.yaml .............................. Render config
│   ├── vercel.json .............................. Vercel config
│   └── .dockerignore ............................ Docker exclusions
│
├── Documentation
│   ├── README.md ................................ Setup guide
│   ├── DEPLOYMENT_GUIDE.md ...................... Basic deployment
│   ├── DEPLOYMENT_ANALYSIS.md ................... Full analysis
│   ├── SECURITY_AND_PRODUCTION_FIXES.md ........ Security fixes
│   └── DEPLOY_NOW.md ............................ Quick start
│
├── Environment
│   ├── .env ...................................... Local config
│   ├── .env.example ............................. Template
│   └── .gitignore ............................... Git exclusions
│
└── Other
    ├── .git/ .................................... Version control
    ├── __pycache__/ ............................. Python cache
    └── storage/ .................................. User uploads (optional)
```

---

## Performance Metrics (Free Tier)

### Expected Performance
```
Metric                Value              Notes
────────────────────────────────────────────────────────
Page Load Time        1-3 seconds        From US to Render
Time to Interactive   2-5 seconds        Vanilla JS = fast
CSS Transfer Size     ~50 KB             Single file
JS Transfer Size      ~150 KB            All files combined
Image Load Time       Varies             No images currently
Database Query Time   <50ms              SQLite is fast
API Response Time     100-500ms          Depends on service

Concurrent Users      ~100               Free tier limit
Memory Usage          ~200 MB            Out of 512 MB free
CPU Usage             ~30-40%            Shared CPU
Daily Bandwidth       ~500 MB            Out of 100GB free
Monthly Storage       ~100 MB            Out of 1GB free
```

### Scaling Path
```
Users/Day    Tier              Cost      Features
────────────────────────────────────────────────────
0-100        Free Render       $0        Works perfectly
100-500      Free Render       $0        Still good
500-2000     Paid Render       $7/mo     Dedicated instance
2000-10k     Paid + DB         $32/mo    PostgreSQL upgrade
10k+         Enterprise        $100+/mo  Multiple instances
```

---

## Security Posture

### Current (Before Fixes)
```
Authentication      ❌ None (any password accepted)
Session            ⚠️  Basic (Flask default)
Database           ❌ No encryption
Transport          ❌ HTTP (needs HTTPS in prod)
Input Validation   ⚠️  Basic
API Access         ⚠️  Minimal checks
Secrets            ❌ Not validated
```

### After Fixes Applied
```
Authentication      ✅ Password hashing (PBKDF2)
Session            ✅ Secure cookies (httpOnly, Secure, SameSite)
Database           ✅ Prepared statements (SQLAlchemy)
Transport          ✅ HTTPS enforced in production
Input Validation   ✅ Email, password, type checks
API Access         ✅ Rate limiting
Secrets            ✅ Environment validation
Logging            ✅ Error tracking
CORS               ✅ Configured for deployment
```

---

## Production Readiness Checklist

### Code Level
- [ ] Flask framework correct (not FastAPI mismatch)
- [ ] Password authentication implemented
- [ ] Environment variables validated
- [ ] Error handling in place
- [ ] Logging configured
- [ ] CORS enabled
- [ ] Session security hardened
- [ ] Rate limiting added

### Infrastructure Level
- [ ] requirements-prod.txt created
- [ ] Procfile for deployment
- [ ] Dockerfile.prod for containers
- [ ] render.yaml for Render deployment
- [ ] vercel.json for Vercel deployment
- [ ] Database connection string ready
- [ ] Environment variables documented
- [ ] API keys obtained (if needed)

### Testing Level
- [ ] Local testing with Gunicorn
- [ ] Database migrations tested
- [ ] API endpoints verified
- [ ] Frontend API calls updated
- [ ] Authentication flow tested
- [ ] Error handling verified
- [ ] Load testing (if needed)

### Deployment Level
- [ ] GitHub repo up to date
- [ ] All files committed
- [ ] Render account created
- [ ] Secrets added to Render
- [ ] Build command verified
- [ ] Start command verified
- [ ] Health checks passing
- [ ] URLs working

### Post-Deployment Level
- [ ] Monitor logs daily
- [ ] Set up alerts (if needed)
- [ ] Database backups scheduled
- [ ] Custom domain (optional)
- [ ] SSL certificate active
- [ ] Performance metrics tracked

---

**✅ Complete architecture documented and ready for deployment!**
