# 🚀 QUICK START DEPLOYMENT GUIDE

## DEPLOY IN 30 MINUTES

### Prerequisites
- GitHub account (free)
- Render account (free)
- Your Study-Comp code on GitHub

---

## STEP 1: Prepare Code (5 minutes)

### 1.1 Create `.env` locally for testing

```bash
# In your Study-Comp folder
cp .env.example .env
```

### 1.2 Edit `.env`

```env
SECRET_KEY=your-super-secret-key-here-change-this
DATABASE_URL=sqlite:///scholarly.db
FLASK_ENV=development
OPENAI_API_KEY=sk-proj-your-key-here-optional
```

### 1.3 Install production dependencies locally

```bash
pip install -r requirements-prod.txt
```

### 1.4 Test with Gunicorn (production server)

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

Visit: `http://localhost:5000`

✅ If it works, proceed to deployment

---

## STEP 2: Push to GitHub (5 minutes)

```bash
git add -A
git commit -m "Add production deployment files"
git push origin main
```

Verify on GitHub that these new files appear:
- ✅ requirements-prod.txt
- ✅ Procfile
- ✅ runtime.txt
- ✅ Dockerfile.prod
- ✅ render.yaml

---

## STEP 3: Create Render Account (2 minutes)

1. Go to [render.com](https://render.com)
2. Click **Sign up** (or click **Sign up with GitHub**)
3. Complete verification
4. **Authorize** Render to access your GitHub repos

---

## STEP 4: Deploy Backend to Render (10 minutes)

### 4.1 Create New Service

1. Dashboard → **New +** → **Web Service**
2. Select `Study-Comp` repository
3. Fill in:
   - **Name**: `scholarly-backend`
   - **Region**: Pick closest to you
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements-prod.txt`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT app:app`

### 4.2 Add Environment Variables

Click **Environment** tab, add:

```
SECRET_KEY=<copy from your local .env>
FLASK_ENV=production
OPENAI_API_KEY=<your OpenAI key if you have one>
DATABASE_URL=sqlite:///scholarly.db
```

### 4.3 Deploy

Click **Create Web Service**

⏳ Wait 3-5 minutes...

✅ You'll see: `Your service is live at https://scholarly-backend-xxxxx.onrender.com`

**SAVE THIS URL** — you'll need it next

---

## STEP 5: Update Frontend API Calls (5 minutes)

Your Render backend URL is: `https://scholarly-backend-xxxxx.onrender.com`

Find all files with `localhost:5000` and change them:

### Find & Replace

```bash
# Find all references
grep -r "localhost:5000" .

# Should find these files:
# - js/dashboard.js
# - js/app.js
# - js/ai-assistant.js
# - etc.
```

### Update Each File

**Example: js/dashboard.js**

```javascript
// BEFORE:
const response = await fetch('http://localhost:5000/api/dashboard');

// AFTER:
const API_URL = 'https://scholarly-backend-xxxxx.onrender.com';
const response = await fetch(`${API_URL}/api/dashboard`);
```

OR better — create a config file:

**Create: `js/config.js`**

```javascript
// Configuration for API endpoint
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : 'https://scholarly-backend-xxxxx.onrender.com';
```

**Then in each file:**

```javascript
// Include the config
// <script src="js/config.js"></script>

// Then use:
const response = await fetch(`${API_URL}/api/dashboard`);
```

### 5.2 Commit & Push

```bash
git add -A
git commit -m "Update API endpoints for production"
git push origin main
```

---

## STEP 6: Test Deployment (5 minutes)

### Test backend health

```bash
curl https://scholarly-backend-xxxxx.onrender.com/
```

Expected: Redirects to `/login` (HTTP 302)

### Test login page

```bash
curl https://scholarly-backend-xxxxx.onrender.com/login
```

Expected: Returns HTML login page

### Test API endpoint

```bash
curl -X POST https://scholarly-backend-xxxxx.onrender.com/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, what is Python?"}' \
  -H "Cookie: session=test-session"
```

Expected: Returns AI response or "Login required"

### Test in Browser

Visit: `https://scholarly-backend-xxxxx.onrender.com`

✅ Should see login page  
✅ Sign up with any email/password  
✅ See dashboard

---

## OPTIONAL: Deploy Frontend to Vercel (10 minutes)

### 6.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel

### 6.2 Deploy Project

1. **New Project** → Import `Study-Comp`
2. Configure:
   - **Framework**: Other
   - **Build Command**: (leave blank)
   - **Output Directory**: (leave blank)
   - **Install Command**: (leave blank)

### 6.3 Add Environment Variables

```
VITE_API_URL=https://scholarly-backend-xxxxx.onrender.com
```

### 6.4 Deploy

Click **Deploy**

⏳ Wait 2 minutes...

✅ You'll see: `Your project is now live at https://study-comp-xxxxx.vercel.app`

---

## ✅ DEPLOYMENT COMPLETE!

### Your Live URLs

| Component | URL |
|-----------|-----|
| **Backend** | `https://scholarly-backend-xxxxx.onrender.com` |
| **Frontend** | `https://study-comp-xxxxx.vercel.app` (optional) |
| **Database** | SQLite (included, 1 GB free) |

### What to Test

- [ ] Login with email/password
- [ ] Create account
- [ ] View dashboard
- [ ] Use AI chat feature
- [ ] Generate quiz
- [ ] Create notes
- [ ] Check analytics

### Share Your App

Send this link to friends:
```
https://scholarly-backend-xxxxx.onrender.com
```

---

## 🆘 TROUBLESHOOTING

### ❌ "Build failed: Flask not found"

**Fix**: Make sure you're using `requirements-prod.txt` in Render

In Render dashboard:
1. Settings → Build Command
2. Change to: `pip install -r requirements-prod.txt`
3. Redeploy

### ❌ "500 Internal Server Error"

**Cause**: Usually missing environment variable

**Fix**: 
1. Render Dashboard → Environment
2. Add: `SECRET_KEY=any-random-string`
3. Redeploy

### ❌ "API endpoint returns 404"

**Cause**: Frontend still calling localhost

**Fix**: Update all API URLs in JavaScript to use Render URL

### ❌ "Slow to load / Timeouts"

**Cause**: Free tier limitations

**Options**:
- Wait a few seconds (server starts up)
- Upgrade Render to paid tier ($7/month)
- Use Railway.app instead

### ❌ "CORS errors in browser console"

**Fix**: The backend automatically serves frontend, no CORS needed

If deploying frontend separately, you need CORS enabled on backend

### ❌ "Database not persisting"

SQLite is ephemeral on Render (resets on redeploy)

**To fix**: Use Supabase PostgreSQL instead of SQLite

1. Create Supabase account: [supabase.com](https://supabase.com)
2. Create project, copy connection string
3. Set in Render: `DATABASE_URL=postgresql://...`

---

## 📱 NEXT STEPS

1. **Monitor your app**: Check Render dashboard daily
2. **Set up backups**: Export database regularly
3. **Custom domain** (optional): Add your own domain
4. **Scale**: Upgrade to paid tier if traffic increases

---

## 💰 COST CHECK

| Service | Cost |
|---------|------|
| Render Backend | **$0/month** |
| Database (SQLite) | **$0/month** |
| Vercel Frontend | **$0/month** |
| **TOTAL** | **$0/month** ✅ |

Optional upgrades only if needed:
- Render paid tier: $7/month
- Supabase database: $25/month
- Custom domain: $12/year

---

## 📞 SUPPORT

- **Render Docs**: [docs.render.com](https://docs.render.com)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Flask Docs**: [flask.palletsprojects.com](https://flask.palletsprojects.com)

---

**You're now live! 🎉**
