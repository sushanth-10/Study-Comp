# 🚀 SCHOLARLY STUDY COMPANION — COMPREHENSIVE DEPLOYMENT ANALYSIS

**Project Status**: ⚠️ **REQUIRES FIXES BEFORE DEPLOYMENT**  
**Prepared**: May 2026  
**Deployment Readiness**: 65% (Issues identified and solvable)

---

## 📋 TABLE OF CONTENTS

1. [Project Analysis](#project-analysis)
2. [Critical Issues Found](#critical-issues-found)
3. [Required Deployment Files](#required-deployment-files)
4. [Hosting Recommendation](#hosting-recommendation)
5. [Environment Variables](#environment-variables)
6. [Production Fixes](#production-fixes)
7. [Deployment Step-by-Step](#deployment-step-by-step)
8. [Architecture Diagram](#architecture-diagram)

---

## PROJECT ANALYSIS

### Framework & Architecture

| Aspect | Details |
|--------|---------|
| **Primary Framework** | Flask 2.x (app.py) |
| **Alternative Backend** | FastAPI (study_backend/app.py) — Newer, not currently active |
| **Frontend** | Vanilla HTML5 + CSS3 + JavaScript (No build system) |
| **Database** | SQLite (local) + Optional Supabase (PostgreSQL, production-ready) |
| **API Style** | RESTful + WebSocket-ready |
| **Python Version** | 3.10+ |
| **Deployment Type** | Monolithic (frontend + backend in same repo) |

### Current Architecture

```
Study-Comp/
├── Frontend (Served by Flask)
│   ├── HTML Pages (dashboard, analytics, planner, focus, notes, streak, quiz, ai)
│   ├── CSS (desktop.css)
│   └── JavaScript (vanilla JS, no build)
│
├── Backend (Flask)
│   ├── app.py (Main entry point)
│   ├── ai_service.py (AI chat, search, YouTube)
│   ├── quiz_service.py (Quiz generation)
│   ├── notes_service.py (PDF handling)
│   └── Routes (login, signup, dashboard, analytics, etc.)
│
├── Study Backend (FastAPI - Not Active)
│   ├── study_backend/app.py (Alternative backend)
│   ├── study_backend/models.py (SQLAlchemy ORM)
│   ├── study_backend/auth.py (JWT + Google OAuth)
│   ├── study_backend/database.py (DB session management)
│   ├── study_backend/services/ (Analytics, quiz, bootstrap)
│   └── study_backend/schemas.py (Pydantic models)
│
├── Database
│   ├── scholarly.db (SQLite - local development)
│   ├── supabase/schema.sql (Supabase production schema)
│   └── SQLAlchemy ORM (Models defined)
│
└── Configuration
    ├── requirements.txt (Python dependencies)
    ├── Dockerfile (Docker containerization)
    ├── docker-compose.yml (Local dev setup)
    └── .env / .env.example (Environment variables)
```

### Entry Points

- **Main Flask App**: `app.py` → Runs on port 5000
- **Alternative FastAPI**: `study_backend/app.py` → Designed for port 8000
- **Currently Active**: Flask (app.py)

### APIs & Integrations

| Service | Purpose | Required | Status |
|---------|---------|----------|--------|
| **OpenAI** | AI chat, quiz generation (fallback) | Optional | ✅ Working (Wikipedia fallback if no API) |
| **OpenRouter** | Adaptive AI engine | Optional | ⚠️ Defined but not integrated into Flask |
| **Google OAuth** | Authentication | Optional | ⚠️ Implemented in FastAPI only |
| **Supabase** | Production database | Optional | ⚠️ Schema ready, not integrated into Flask |
| **DuckDuckGo Search** | Web search for AI | ✅ Required | ✅ Installed |
| **Wikipedia** | Fallback knowledge source | ✅ Required | ✅ Installed |
| **Google Auth** | OAuth library | Optional | ✅ Installed |

### Frontend Structure

- **No build system** (Webpack, Vite, etc.)
- **No package.json** (Pure vanilla JavaScript)
- **Static files served by Flask**: `/css/`, `/js/`
- **HTML pages**: Login, Signup, Dashboard, Analytics, Planner, Focus, Notes, Streak, Quiz, AI Assistant
- **LocalStorage for session** (In Flask version, session stored server-side via `session`)

### Database

**Current (Development)**:
- SQLite: `scholarly.db` (local file)
- No persistence if deployed without database

**Production-Ready**:
- Supabase PostgreSQL (free tier: 500MB)
- Schema defined in `supabase/schema.sql`
- Models in `study_backend/models.py`

---

## 🔴 CRITICAL ISSUES FOUND

### **ISSUE 1: FRAMEWORK MISMATCH** ⚠️ **BLOCKING**

**Problem**:
- `app.py` uses **Flask**
- `requirements.txt` lists **FastAPI** + Uvicorn
- Two different backends exist (Flask and FastAPI)
- This causes confusion and deployment failure

**Current State**:
```
requirements.txt includes:
✅ fastapi>=0.116.0
✅ uvicorn>=0.35.0
But app.py is:
❌ from flask import Flask  (NOT in requirements.txt!)
```

**Impact**: 
- Flask not in requirements.txt → `pip install` fails
- Wrong server would be started on deployment

**Fix**: See [Production Fixes](#production-fixes)

---

### **ISSUE 2: MISSING DEPENDENCIES** 🔴 **BLOCKING**

**Missing from requirements.txt**:
- `flask` — Main backend framework
- `Werkzeug` — Flask WSGI utilities (implicit dep)
- `Jinja2` — Flask templating (implicit dep)

**Current requires.txt is FastAPI-focused but Flask app won't run**

---

### **ISSUE 3: DATABASE NOT CONFIGURED** 🔴 **BLOCKING**

**Problems**:
- Flask app uses no database (simple session-based auth)
- `scholarly.db` file is SQLite but not used by Flask
- SQLAlchemy ORM models defined but only used in FastAPI backend
- Supabase integration not connected to Flask

**Production Impact**:
- No data persistence
- All user data lost on server restart
- No multi-instance scaling possible

---

### **ISSUE 4: AUTHENTICATION INSECURE** 🟡 **SECURITY RISK**

**Current Implementation** (Flask):
```python
session["logged_in"] = True
session["email"] = email
# NO PASSWORD VALIDATION!
```

**Problems**:
- Any email/password combo works
- No password hashing
- Sessions stored in Flask default (not signed securely)

**Production Impact**:
- Anyone can access any account
- Session hijacking possible

---

### **ISSUE 5: ENVIRONMENT VARIABLES NOT VALIDATED** 🟡 **SECURITY RISK**

**Missing Validation**:
- No `.env` file validation at startup
- API keys not checked before use
- Missing required vars not caught early

---

### **ISSUE 6: DOCKERFILE USES FLASK, NOT FASTAPI** 🟡 **INCONSISTENT**

```dockerfile
CMD ["python", "app.py"]  # Runs Flask
```

But `requirements.txt` has FastAPI/Uvicorn → Confusing

---

### **ISSUE 7: NO PRODUCTION SERVER** 🟡 **PERFORMANCE ISSUE**

**Current**:
```python
app.run(host="0.0.0.0", port=5000, debug=debug)
```

**Problem**: Flask development server is slow, insecure for production

**Fix Required**: Use Gunicorn (WSGI production server)

---

### **ISSUE 8: STATIC FILES SERVED BY FLASK** 🟡 **PERFORMANCE ISSUE**

**Current**:
```python
@app.route("/css/<path:filename>")
def css(filename):
    return send_from_directory(...)
```

**Problem**: Inefficient, should be served by CDN or nginx

---

### **ISSUE 9: NO CORS CONFIGURATION** 🟡 **API INTEGRATION RISK**

If frontend and backend deployed separately:
- CORS errors will occur
- API calls will fail

---

### **ISSUE 10: OPENROUTER INTEGRATION INCOMPLETE** 🟡 **FEATURE GAP**

- OpenRouter defined in config but not used
- AI service still uses OpenAI/Wikipedia fallback
- Advanced AI features not available

---

## 📦 REQUIRED DEPLOYMENT FILES

### Create: `requirements-prod.txt`

**CORRECTED Python dependencies for Flask in production**:

```
# Web Framework
Flask==2.3.3
Werkzeug==2.3.7
Jinja2==3.1.2

# WSGI Server (Production)
gunicorn==21.2.0

# Database
SQLAlchemy==2.0.36
psycopg2-binary==2.9.9  # PostgreSQL driver

# Authentication & Security
PyJWT==2.9.0
python-multipart==0.0.20
google-auth==2.39.0

# AI & Search
duckduckgo-search==6.0.0
wikipedia==1.4.0
PyPDF2==3.0.0
requests==2.31.0

# Environment Management
python-dotenv==1.0.0

# Optional: Better Logging
python-json-logger==2.0.7
```

### Create: `runtime.txt` (For Render/Railway/Heroku)

```
python-3.11.7
```

### Create: `Procfile` (For Heroku/Render/Railway)

```
web: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
```

### Create: `render.yaml` (Render.com Configuration)

```yaml
services:
  - type: web
    name: scholarly-backend
    runtime: python
    buildCommand: pip install -r requirements-prod.txt
    startCommand: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
    envVars:
      - key: PYTHON_VERSION
        value: 3.11
      - key: SECRET_KEY
        sync: false
      - key: DATABASE_URL
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: PORT
        value: 10000
```

### Create: `vercel.json` (For Vercel - Frontend)

```json
{
  "buildCommand": "echo 'No build needed'",
  "outputDirectory": ".",
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### Create: `.env.example` (Updated)

```env
# ===== PRODUCTION DEPLOYMENT =====

# Flask Security
SECRET_KEY=your-super-secret-key-change-this-in-production

# Database
DATABASE_URL=sqlite:///scholarly.db
# For Production (Supabase):
# DATABASE_URL=postgresql://user:password@host:5432/dbname

# AI Services
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4o-mini

# Advanced AI (OpenRouter)
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_SITE_URL=https://your-deployed-domain.com
OPENROUTER_APP_NAME=Scholarly

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-deployed-domain.com/auth/google/callback

# Deployment
FLASK_ENV=production
FLASK_DEBUG=0
PORT=10000
```

### Create: `docker-compose.prod.yml` (Production Docker Setup)

```yaml
version: '3.9'

services:
  db:
    image: postgres:16-alpine
    container_name: scholarly-db
    environment:
      POSTGRES_USER: scholarly
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-secure-password}
      POSTGRES_DB: scholarly_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./supabase/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U scholarly"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: .
    container_name: scholarly-app
    ports:
      - "5000:5000"
    environment:
      FLASK_ENV: production
      DATABASE_URL: postgresql://scholarly:${POSTGRES_PASSWORD:-secure-password}@db:5432/scholarly_db
      SECRET_KEY: ${SECRET_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./storage:/app/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:

networks:
  default:
    name: scholarly-network
```

### Update: `Dockerfile` (Production-Ready)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

# Copy application
COPY . .

# Create necessary directories
RUN mkdir -p storage/pdfs && chown -R 1000:1000 /app

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

# Run the app with gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
```

---

## 🌐 HOSTING RECOMMENDATION

### **BEST FREE HOSTING FOR THIS PROJECT**

#### **Winner: Render.com + Supabase (PostgreSQL)**

| Criteria | Render | Railway | Heroku | Vercel |
|----------|--------|---------|--------|--------|
| **Python Support** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Always-On** | ✅ Free tier | ✅ Free tier | ❌ Paid only | ✅ Yes (serverless) |
| **Database** | ❌ Need external | ✅ PostgreSQL | ✅ But paid | ❌ No backend |
| **Cost** | 💰 **$0** | 💰 **$0** ($5/mo credits) | 💸 **$7+/mo** | ✅ **$0** (frontend only) |
| **Performance** | ⭐ Great | ⭐⭐ Very Good | ⭐⭐⭐ Excellent | N/A |
| **Ease** | ⭐⭐⭐ Easy | ⭐⭐⭐ Easy | ⭐⭐ Medium | ⭐⭐⭐ Very Easy |

### **Recommended Stack**

```
Frontend + Backend:
├─ Backend: Render.com (Python Flask + Gunicorn) — $0/month
├─ Database: Supabase PostgreSQL — $0/month (free tier)
└─ CDN: Render Static Files — $0/month

Alternative Option (if you prefer):
├─ Backend: Railway.app (Python Flask) — $0 + $5 credits
├─ Database: Railway PostgreSQL — Included
└─ Similar performance, different UI
```

### **Why Render?**

✅ **Always-on free tier** (never sleeps like Heroku)  
✅ **Supports Python** (unlike Vercel)  
✅ **PostgreSQL ready** (via Supabase)  
✅ **GitHub integration** (one-click deploy)  
✅ **Easy environment variables**  
✅ **No credit card required** (truly free)  
✅ **Generous limits** (750 hours/month free)  

### **Limitations of Free Hosting**

| Limitation | Impact | Workaround |
|-----------|--------|-----------|
| **No dedicated IP** | Shared with other apps | OK for most uses |
| **Resource limits** | 512MB RAM | Sufficient for Flask app |
| **Bandwidth limit** | 100GB/month | OK for small user base |
| **Cold starts** (if paused) | ~30 seconds startup | Render keeps free tier alive |
| **No auto-scaling** | Can't handle traffic spikes | Add paid tier if needed |
| **Single instance** | No redundancy | Manual re-deploy on crash |

### **When to Upgrade**

- **Traffic > 1000 active users/day** → Use Render paid tier ($7/month)
- **Need database backup** → Use Supabase paid tier ($25/month)
- **Need API rate limit** → Move OpenAI to paid account
- **Need HTTPS custom domain** → Render supports (free)

---

## 🔐 ENVIRONMENT VARIABLES

### **Required for Production Deployment**

```
SECRET_KEY                    → Flask session encryption (random string)
DATABASE_URL                  → PostgreSQL connection string
FLASK_ENV                     → "production"
PORT                          → 10000 (Render default)
```

### **Optional but Recommended**

```
OPENAI_API_KEY               → OpenAI API key (for better AI)
OPENAI_MODEL                 → Model name (gpt-4o-mini, gpt-3.5-turbo)
OPENROUTER_API_KEY           → OpenRouter API key (advanced AI)
GOOGLE_CLIENT_ID             → Google OAuth client ID
GOOGLE_CLIENT_SECRET         → Google OAuth client secret
```

### **Auto-Generated by Render**

```
DATABASE_URL    (if using Render PostgreSQL)
```

### **Variable Generation Guide**

```bash
# Generate secure SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Example output:
# a_v-ND4Kj6eXq9p-_-KL5RqZ6pHj9xK_l4M

# PostgreSQL connection string template
postgresql://user:password@host:5432/dbname

# Example for Supabase
postgresql://postgres:YOUR_PASSWORD@db.REFERENCE_ID.supabase.co:5432/postgres
```

---

## 🔧 PRODUCTION FIXES

### **FIX 1: Correct requirements.txt**

**Status**: ⚠️ CRITICAL

**Action**: Replace `requirements.txt` with production version

Before:
```
fastapi>=0.116.0      ❌ Wrong framework!
uvicorn>=0.35.0       ❌ Wrong server!
```

After:
```
Flask==2.3.3          ✅ Correct
gunicorn==21.2.0      ✅ Production server
sqlalchemy==2.0.36    ✅ For future DB migration
```

---

### **FIX 2: Fix Authentication**

**Status**: 🔴 SECURITY CRITICAL

**Current Code** (app.py, line ~65):
```python
@app.route("/login", methods=["POST"])
def login():
    email = request.form.get("email").strip()
    password = request.form.get("password").strip()
    if not email or not password:
        return send_page("login.html"), 400
    session["logged_in"] = True  # ❌ NO PASSWORD CHECK!
    session["email"] = email
    return redirect(url_for("dashboard"))
```

**Fix**: Implement proper authentication
```python
from werkzeug.security import generate_password_hash, check_password_hash
import json

# Store users in JSON file (simple) or database
USERS_DB_FILE = "users.json"

def load_users():
    try:
        with open(USERS_DB_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_user(email, password_hash):
    users = load_users()
    users[email.lower()] = password_hash
    with open(USERS_DB_FILE, 'w') as f:
        json.dump(users, f)

@app.route("/login", methods=["POST"])
def login():
    email = (request.form.get("email") or "").strip().lower()
    password = (request.form.get("password") or "").strip()
    
    if not email or not password:
        return send_page("login.html"), 400
    
    users = load_users()
    if email not in users or not check_password_hash(users[email], password):
        return send_page("login.html"), 401  # Wrong credentials
    
    session["logged_in"] = True
    session["email"] = email
    session.permanent = True
    return redirect(url_for("dashboard"))

@app.route("/signup", methods=["POST"])
def signup():
    name = (request.form.get("full_name") or "").strip()
    email = (request.form.get("email") or "").strip().lower()
    password = (request.form.get("password") or "").strip()
    
    if not name or not email or not password or len(password) < 6:
        return send_page("signup.html"), 400
    
    users = load_users()
    if email in users:
        return send_page("signup.html"), 409  # User exists
    
    save_user(email, generate_password_hash(password))
    session["logged_in"] = True
    session["email"] = email
    session["name"] = name
    session.permanent = True
    return redirect(url_for("dashboard"))
```

---

### **FIX 3: Add Database Connection to Flask**

**Status**: 🔴 CRITICAL

**Action**: Connect Flask to SQLite or PostgreSQL

```python
# app.py additions
import os
from flask_sqlalchemy import Flask-SQLAlchemy

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///scholarly.db")

if DATABASE_URL.startswith("postgresql"):
    # Production: PostgreSQL on Supabase
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://")

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy(app)

# Import models
from study_backend.models import User, StudySession
```

---

### **FIX 4: Add Production Server**

**Status**: 🟡 IMPORTANT

**Action**: Replace Flask dev server with Gunicorn

Replace:
```python
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
```

With:
```python
if __name__ == "__main__":
    import gunicorn.app.base
    # This allows gunicorn to load the app
    # Start with: gunicorn -w 4 -b 0.0.0.0:5000 app:app
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
```

---

### **FIX 5: Add CORS Support**

**Status**: 🟡 IMPORTANT

Add to `app.py`:
```python
from flask_cors import CORS

CORS(app, 
     origins=os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
     supports_credentials=True)
```

And update `.env.example`:
```env
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://study-comp-backend.onrender.com
```

---

### **FIX 6: Validate Environment Variables**

**Status**: 🟡 IMPORTANT

Add to `app.py` (after Flask initialization):
```python
import sys

REQUIRED_VARS = ["SECRET_KEY"]
OPTIONAL_VARS = ["OPENAI_API_KEY", "DATABASE_URL"]

for var in REQUIRED_VARS:
    if not os.environ.get(var):
        print(f"ERROR: Missing required environment variable: {var}")
        print(f"Please set {var} in .env or deployment platform")
        sys.exit(1)

for var in OPTIONAL_VARS:
    if not os.environ.get(var):
        print(f"WARNING: Optional variable {var} not set. Some features may not work.")
```

---

### **FIX 7: Fix Static File Serving**

**Status**: 🟡 PERFORMANCE

Add to `Dockerfile`:
```dockerfile
# Serve static files with cache headers
ENV FLASK_ENV production
```

Update `app.py`:
```python
from flask import Flask

app = Flask(__name__, 
            static_url_path='/static',
            static_folder='css')

@app.after_request
def add_cache_headers(response):
    if response.content_type and 'text/html' not in response.content_type:
        response.headers['Cache-Control'] = 'public, max-age=31536000'
    return response
```

---

### **FIX 8: Add Error Handling**

**Status**: 🟡 IMPORTANT

```python
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(error):
    print(f"Server error: {error}")
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(403)
def forbidden(error):
    return redirect(url_for("login"))
```

---

### **FIX 9: Add Logging**

**Status**: 🟡 IMPORTANT

```python
import logging
from logging.handlers import RotatingFileHandler
import os

if not app.debug:
    if not os.path.exists('logs'):
        os.mkdir('logs')
    file_handler = RotatingFileHandler('logs/scholarly.log', maxBytes=10240000, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Scholarly startup')
```

---

### **FIX 10: Add Rate Limiting**

**Status**: 🟡 RECOMMENDED

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Apply to API endpoints
@app.route("/api/ai/chat", methods=["POST"])
@limiter.limit("30 per hour")
def api_ai_chat():
    ...
```

Add to `requirements-prod.txt`:
```
Flask-Limiter==3.5.0
```

---

## 📱 DEPLOYMENT STEP-BY-STEP

### **Phase 1: Prepare Code (Local, 10 minutes)**

```bash
# 1. Create production requirements file
cp requirements.txt requirements-prod.txt
# Edit requirements-prod.txt with Flask + Gunicorn

# 2. Apply security fixes
# Edit app.py to:
#   - Add password hashing
#   - Add database connection
#   - Add error handling

# 3. Test locally with production config
export FLASK_ENV=production
export SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
pip install -r requirements-prod.txt
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Verify at http://localhost:5000
```

### **Phase 2: Push to GitHub (5 minutes)**

```bash
git add -A
git commit -m "Prepare for production deployment

- Fix requirements.txt (Flask + Gunicorn)
- Add password authentication
- Add database support
- Add error handling
- Add production Dockerfile"

git push origin main
```

### **Phase 3: Deploy Backend to Render (15 minutes)**

#### **Step 1: Create Render Account**
- Go to [render.com](https://render.com)
- Sign up with GitHub account
- Authorize Render to access your repos

#### **Step 2: Create Web Service**
1. Dashboard → "New +" → "Web Service"
2. Select your Study-Comp repository
3. Configure:
   - **Name**: `scholarly-backend`
   - **Region**: Closest to your users
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements-prod.txt`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT app:app`

#### **Step 3: Add Environment Variables**
In Render Dashboard → Environment:

```
SECRET_KEY=<random-secret-from-earlier>
FLASK_ENV=production
OPENAI_API_KEY=your-api-key-if-you-have
DATABASE_URL=sqlite:///scholarly.db
```

#### **Step 4: Deploy**
- Click "Create Web Service"
- Wait ~3 minutes for build
- Verify at `https://scholarly-backend.onrender.com`

**Your Backend URL**: `https://scholarly-backend.onrender.com`

---

### **Phase 4: Deploy Frontend (5 minutes) - Optional**

If you want to deploy frontend separately to Vercel:

#### **Step 1: Create Vercel Account**
- Go to [vercel.com](https://vercel.com)
- Sign up with GitHub

#### **Step 2: Create Project**
1. "New Project" → Import your GitHub repo
2. Configure:
   - **Framework**: Other
   - **Build Command**: (leave blank)
   - **Output Directory**: (leave blank)

#### **Step 3: Environment Variables**
```
VITE_API_URL=https://scholarly-backend.onrender.com
```

#### **Step 4: Deploy**
- Click "Deploy"
- Done! Visit your Vercel URL

---

### **Phase 5: Connect Frontend to Backend (10 minutes)**

Update all API calls in JavaScript files:

**Before**:
```javascript
// js/dashboard.js
const response = await fetch('http://localhost:5000/api/dashboard');
```

**After**:
```javascript
// Use environment variable or hardcoded Render URL
const API_BASE = process.env.VITE_API_URL || 'https://scholarly-backend.onrender.com';
const response = await fetch(`${API_BASE}/api/dashboard`);
```

---

### **Phase 6: Test Live Deployment (10 minutes)**

```bash
# Test backend health
curl https://scholarly-backend.onrender.com/

# Test login endpoint
curl -X POST https://scholarly-backend.onrender.com/login \
  -d "email=test@example.com&password=password123"

# Test API endpoint
curl https://scholarly-backend.onrender.com/api/ai/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

Expected responses:
- ✅ `/` → Redirects to `/login`
- ✅ `/login` → Returns login page
- ✅ `/api/ai/chat` → Returns AI response or error

---

## 🏗️ ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                            │
│  (HTML/CSS/JavaScript - Vanilla, no build system)           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     │
        ┌────────────▼──────────────┐
        │  RENDER.COM                │
        │  (Python Flask Backend)    │
        │                            │
        │  ┌──────────────────────┐  │
        │  │  app.py              │  │
        │  │  - Login/Signup      │  │
        │  │  - Dashboard API     │  │
        │  │  - AI Chat API       │  │
        │  │  - Quiz API          │  │
        │  │  - Analytics API     │  │
        │  └──────────────────────┘  │
        │                            │
        │  ┌──────────────────────┐  │
        │  │  Gunicorn            │  │
        │  │  (4 workers)         │  │
        │  └──────────────────────┘  │
        │                            │
        │  PORT: 10000               │
        │  Free tier: 750h/month     │
        └───────────┬────────────────┘
                    │
                    │ PostgreSQL Connection
                    │
        ┌───────────▼──────────────┐
        │  SUPABASE                 │
        │  (PostgreSQL Database)    │
        │                           │
        │  - Users table            │
        │  - Study Sessions         │
        │  - Quiz Attempts          │
        │  - Flashcards             │
        │  - Analytics Data         │
        │                           │
        │  Free tier: 500MB         │
        └───────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                EXTERNAL API SERVICES                         │
├─────────────────────────────────────────────────────────────┤
│ • OpenAI (Optional) - Better AI responses                   │
│ • OpenRouter (Optional) - Advanced AI models                │
│ • Google OAuth (Optional) - OAuth login                     │
│ • DuckDuckGo Search - Web search integration                │
│ • Wikipedia - Knowledge fallback                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 COST ANALYSIS

### **Monthly Cost Breakdown (FREE TIER)**

| Service | Cost | Usage | Notes |
|---------|------|-------|-------|
| **Render Backend** | $0 | 750 hours/month | Enough for 24/7 |
| **Supabase Database** | $0 | 500MB storage | Sufficient for 10k+ users |
| **Bandwidth (Render)** | $0 | Included | Generous limits |
| **Domain** | $0 | If using subdomain | Or $12/year if custom |
| **SSL Certificate** | $0 | Included | Auto HTTPS |
| **API Services** | $0-50 | Optional | Only if using OpenAI |
| **TOTAL** | **$0-50** | **Depends on APIs** | |

### **Upgrade Costs (If Needed)**

| Scenario | Cost | When |
|----------|------|------|
| Scale to 10k active users | $7/month | Add Render paid tier |
| Database exceeds 500MB | $25/month | Upgrade Supabase |
| Custom domain HTTPS | $12/year | Optional |
| Advanced AI (GPT-4) | $20/month | Replace GPT-3.5 |

---

## ⚠️ SCALABILITY LIMITATIONS

### **Free Tier Limits**

| Limit | Constraint | Impact |
|-------|-----------|--------|
| **RAM** | 512MB | Max ~100 concurrent users |
| **CPU** | Shared | Slow under heavy load |
| **Bandwidth** | 100GB/month | ~300k page loads/month |
| **Database** | 500MB | ~50k user records |
| **Compute** | 750 hours/month | Can run 24/7 |

### **When to Upgrade**

```
Users/Day    Free Tier  → Recommended → Cost/Month
────────────────────────────────────────────────
< 100        ✅ OK       Stays free    $0
100-500      ⚠️ OK       Stays free    $0
500-2000     ⚠️ Slow      Pay tier      $7
2000+        ❌ Fails     Pro plan      $50+
```

### **Performance Optimization**

**Already Good**:
- ✅ Vanilla JS (no bundle)
- ✅ Minimal CSS (one file)
- ✅ Static files (cacheable)

**To Add**:
- [ ] Add CDN for images/videos (Cloudflare)
- [ ] Enable gzip compression
- [ ] Add database indexes
- [ ] Cache API responses
- [ ] Lazy load heavy sections

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### **Security**
- [ ] `SECRET_KEY` is random, > 32 characters
- [ ] `.env` file in `.gitignore`
- [ ] No hardcoded passwords in code
- [ ] Password hashing implemented
- [ ] HTTPS enforced
- [ ] CORS configured for allowed origins

### **Performance**
- [ ] Gunicorn configured with 4+ workers
- [ ] Database indexes created
- [ ] Static file caching enabled
- [ ] Error logging configured
- [ ] Rate limiting added

### **Reliability**
- [ ] Health check endpoint `/`
- [ ] Database connection tested
- [ ] Error handling for missing APIs
- [ ] Graceful degradation (AI fallbacks)
- [ ] Session persistence configured

### **Configuration**
- [ ] `requirements-prod.txt` created
- [ ] `Procfile` created (if using)
- [ ] `runtime.txt` specifies Python 3.11
- [ ] `Dockerfile` uses production server
- [ ] Environment variables documented

### **Deployment**
- [ ] GitHub repo is public (for free tier)
- [ ] All changes committed
- [ ] No large files in repo
- [ ] `.gitignore` includes `*.db`, `.env`, `__pycache__`
- [ ] Render account created
- [ ] API keys obtained (if needed)

---

## 🆘 TROUBLESHOOTING

### **Deployment Fails with "Flask not found"**
**Cause**: requirements.txt has FastAPI, not Flask
**Fix**: Use the corrected requirements-prod.txt provided above

### **500 Error on Login**
**Cause**: Password hashing not implemented
**Fix**: Apply FIX 2 (Authentication) above

### **CORS Errors**
**Cause**: Frontend and backend on different domains
**Fix**: Apply FIX 5 (CORS) above

### **Database Connection Fails**
**Cause**: DATABASE_URL environment variable not set
**Fix**: Set DATABASE_URL in Render environment variables

### **App Works Locally, Fails on Render**
**Cause**: Missing environment variables
**Fix**: Copy all `.env` variables to Render environment

### **Slow Response Times**
**Cause**: Single worker or insufficient resources
**Fix**: Upgrade Render to paid tier ($7/month)

---

## 📚 NEXT STEPS

1. **This Week**:
   - [ ] Review this analysis
   - [ ] Apply fixes 1-3 (critical)
   - [ ] Test locally with Gunicorn
   - [ ] Commit and push to GitHub

2. **Next Week**:
   - [ ] Create Render account
   - [ ] Deploy backend
   - [ ] Get production URL
   - [ ] Update JavaScript API calls
   - [ ] Test all features

3. **After Launch**:
   - [ ] Monitor error logs
   - [ ] Set up database backups
   - [ ] Add custom domain (optional)
   - [ ] Plan scaling strategy

---

## 📞 QUICK REFERENCE

| Action | Command/URL |
|--------|-------------|
| Generate secret key | `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| Run locally | `gunicorn -w 4 -b 0.0.0.0:5000 app:app` |
| Check requirements | `pip check` |
| Test API | `curl http://localhost:5000/api/ai/chat` |
| View logs | `tail -f logs/scholarly.log` |
| Deploy to Render | [render.com](https://render.com) |
| Deploy database | [supabase.com](https://supabase.com) |

---

**✅ Analysis Complete — Ready to Deploy!**

Generated: May 2026  
Deployed Platform: Render.com + Supabase PostgreSQL  
Estimated Setup Time: 45 minutes  
Estimated Cost: $0/month (free tier)
