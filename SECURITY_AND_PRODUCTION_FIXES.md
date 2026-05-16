# SECURITY & PRODUCTION FIXES

## 🔴 FIX #1: Add Flask to Requirements (CRITICAL)

### Current Problem
`requirements.txt` lists FastAPI but Flask is actually used.  
When deployed, `pip install` fails because Flask is missing.

### Solution

**Replace `requirements.txt` with `requirements-prod.txt`** (already created)

OR update existing `requirements.txt`:

```diff
+ Flask==2.3.3
+ Werkzeug==2.3.7
+ Jinja2==3.1.2
+ gunicorn==21.2.0
- fastapi>=0.116.0
- uvicorn>=0.35.0
```

---

## 🔴 FIX #2: Implement Password Authentication (CRITICAL)

### Current Problem
```python
# Current code - SECURITY RISK!
@app.route("/login", methods=["POST"])
def login():
    email = request.form.get("email").strip()
    password = request.form.get("password").strip()
    if not email or not password:
        return send_page("login.html"), 400
    session["logged_in"] = True  # ❌ Accepts ANY password!
    session["email"] = email
    return redirect(url_for("dashboard"))
```

**Anyone can login with any password!**

### Solution

Add at top of `app.py`:

```python
import hashlib
import secrets
import json
from pathlib import Path
from werkzeug.security import generate_password_hash, check_password_hash

# Simple user database (JSON file)
USERS_FILE = Path("users.json")

def load_users():
    """Load users from JSON file"""
    if USERS_FILE.exists():
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    """Save users to JSON file"""
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def get_user(email):
    """Get user by email"""
    users = load_users()
    return users.get(email.lower())

def create_user(email, password, name=""):
    """Create new user with hashed password"""
    email = email.lower().strip()
    users = load_users()
    
    if email in users:
        return False  # User exists
    
    users[email] = {
        "password_hash": generate_password_hash(password),
        "name": name,
        "created_at": datetime.now().isoformat()
    }
    save_users(users)
    return True

def verify_user(email, password):
    """Verify user credentials"""
    email = email.lower().strip()
    user_data = get_user(email)
    
    if not user_data:
        return False
    
    return check_password_hash(user_data["password_hash"], password)
```

Replace login route:

```python
@app.route("/login", methods=["POST"])
def login():
    email = (request.form.get("email") or "").strip()
    password = (request.form.get("password") or "").strip()
    
    if not email or not password:
        return send_page("login.html"), 400
    
    # ✅ FIXED: Verify password!
    if not verify_user(email, password):
        return send_page("login.html"), 401  # Wrong credentials
    
    # Get user info
    users = load_users()
    user_data = users.get(email.lower(), {})
    
    session["logged_in"] = True
    session["email"] = email
    session["name"] = user_data.get("name", "User")
    session.permanent = True
    app.permanent_session_lifetime = timedelta(days=30)
    
    return redirect(url_for("dashboard"))
```

Replace signup route:

```python
@app.route("/signup", methods=["POST"])
def signup():
    name = (request.form.get("full_name") or "").strip()
    email = (request.form.get("email") or "").strip()
    password = (request.form.get("password") or "").strip()
    
    # ✅ FIXED: Validate input
    if not name or not email or not password:
        return send_page("signup.html"), 400
    
    if len(password) < 6:
        return send_page("signup.html"), 400  # Password too short
    
    if len(email) > 255 or "@" not in email:
        return send_page("signup.html"), 400  # Invalid email
    
    # ✅ FIXED: Check if user exists
    if not create_user(email, password, name):
        return send_page("signup.html"), 409  # User already exists
    
    session["logged_in"] = True
    session["email"] = email
    session["name"] = name
    session.permanent = True
    app.permanent_session_lifetime = timedelta(days=30)
    
    return redirect(url_for("dashboard"))
```

Add imports at top:

```python
from datetime import timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import json
from pathlib import Path
from datetime import datetime
```

---

## 🔴 FIX #3: Add Environment Variable Validation (CRITICAL)

Add after Flask app creation:

```python
import sys
from os import environ

# ===== VALIDATE ENVIRONMENT VARIABLES =====

REQUIRED_VARS = ["SECRET_KEY"]
OPTIONAL_VARS = ["OPENAI_API_KEY", "DATABASE_URL", "OPENROUTER_API_KEY"]

# Check required variables
missing = [var for var in REQUIRED_VARS if not environ.get(var)]
if missing:
    print("\n❌ DEPLOYMENT ERROR: Missing required environment variables:")
    for var in missing:
        print(f"   - {var}")
    print("\nSet these in .env or your deployment platform's environment variables")
    sys.exit(1)

# Warn about optional variables
for var in OPTIONAL_VARS:
    if not environ.get(var):
        print(f"⚠️  WARNING: Optional variable '{var}' not set")

print("✅ All required environment variables validated")
```

---

## 🟡 FIX #4: Add Production Server (Gunicorn)

### Current Problem
```python
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=debug)
```

Flask dev server is slow and insecure for production.

### Solution

Update the main block:

```python
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    
    if os.environ.get("FLASK_ENV") == "production":
        # In production, use gunicorn (see Procfile)
        # This block is only for local development
        print(f"⚠️  WARNING: Running in development mode")
        print(f"   For production, use: gunicorn app:app")
    
    print(f"\n🚀 Scholarly running at http://127.0.0.1:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug, threaded=True)
```

In production, Gunicorn will run it (see Procfile):
```
gunicorn -w 4 -b 0.0.0.0:$PORT app:app
```

---

## 🟡 FIX #5: Add CORS Support for Separated Deployments

### Problem
If frontend and backend are on different domains, you get CORS errors.

### Solution

Add to `app.py` (after imports):

```python
from flask_cors import CORS

# Configure CORS
CORS_ALLOWED = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:5000").split(",")

CORS(app,
     origins=CORS_ALLOWED,
     supports_credentials=True,
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"]
)
```

Add to `.env`:
```
ALLOWED_ORIGINS=https://scholarly-backend-xxxxx.onrender.com,https://your-frontend-url.com
```

Add to `requirements-prod.txt`:
```
Flask-CORS==4.0.0
```

---

## 🟡 FIX #6: Add Error Handling

Add to `app.py`:

```python
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Internal error: {error}")
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(403)
def forbidden_error(error):
    return redirect(url_for("login"))

@app.errorhandler(400)
def bad_request_error(error):
    return jsonify({"error": "Bad request"}), 400
```

---

## 🟡 FIX #7: Add Logging for Production

Add after app creation:

```python
import logging
from logging.handlers import RotatingFileHandler
import os

# ===== LOGGING CONFIGURATION =====

if not app.debug:
    if not os.path.exists('logs'):
        os.mkdir('logs')
    
    # File handler
    file_handler = RotatingFileHandler(
        'logs/scholarly.log',
        maxBytes=10240000,  # 10MB
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [%(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Scholarly app started')

# Console logging
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
app.logger.addHandler(console_handler)
```

---

## 🟡 FIX #8: Add Session Security

Replace existing session config:

```python
# ===== SESSION CONFIGURATION =====

app.config['SESSION_COOKIE_SECURE'] = os.environ.get("FLASK_ENV") == "production"
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
app.config['SESSION_REFRESH_EACH_REQUEST'] = False

# For development
if os.environ.get("FLASK_ENV") != "production":
    app.config['SESSION_COOKIE_SECURE'] = False
```

---

## 🟡 FIX #9: Add Rate Limiting (Optional but Recommended)

Add imports:

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
```

Configure after CORS:

```python
# ===== RATE LIMITING =====

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Apply to API endpoints
```

Add to API endpoints:

```python
@app.route("/api/ai/chat", methods=["POST"])
@limiter.limit("30 per hour")
@login_required
def api_ai_chat():
    # ...
    pass

@app.route("/api/quiz/generate", methods=["POST"])
@limiter.limit("20 per day")
@login_required
def api_quiz_generate():
    # ...
    pass
```

Add to `requirements-prod.txt`:
```
Flask-Limiter==3.5.0
```

---

## 🟡 FIX #10: Add Cache Headers for Static Files

Add after app creation:

```python
@app.after_request
def add_cache_headers(response):
    """Add cache headers for static files"""
    if response.content_type:
        # Cache static files (CSS, JS, images)
        if any(ext in response.content_type for ext in ['javascript', 'css', 'image']):
            response.headers['Cache-Control'] = 'public, max-age=31536000'  # 1 year
        # Don't cache HTML
        elif 'text/html' in response.content_type:
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response
```

---

## 📋 IMPLEMENTATION CHECKLIST

- [ ] Add Flask to requirements-prod.txt
- [ ] Implement password hashing (Fix #2)
- [ ] Add environment variable validation (Fix #3)
- [ ] Update Procfile for Gunicorn (Fix #4)
- [ ] Add CORS support (Fix #5)
- [ ] Add error handlers (Fix #6)
- [ ] Add logging (Fix #7)
- [ ] Secure sessions (Fix #8)
- [ ] Add rate limiting (Fix #9)
- [ ] Add cache headers (Fix #10)
- [ ] Test locally with Gunicorn
- [ ] Commit and push to GitHub
- [ ] Deploy to Render

---

## 🧪 Testing Fixes

### Test authentication
```bash
# Should fail with 401
curl -X POST http://localhost:5000/login \
  -d "email=test@test.com&password=wrongpassword"

# Should succeed
curl -X POST http://localhost:5000/login \
  -d "email=test@test.com&password=correctpassword"
```

### Test environment variables
```bash
# Should fail if SECRET_KEY missing
unset SECRET_KEY
python app.py
# Should print error and exit
```

### Test rate limiting
```bash
# Make requests rapidly to AI endpoint
for i in {1..35}; do
  curl -X POST http://localhost:5000/api/ai/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"test"}'
done
# Should get 429 (Rate limit) after 30 requests
```

---

**All fixes applied? Ready to deploy! 🚀**
