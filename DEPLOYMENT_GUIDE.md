# Free Deployment Guide

## Quick Deployment (5 minutes)

### Backend (Python Flask) - Deploy to Render or Railway

**Option 1: Render (Recommended)**
1. Go to [render.com](https://render.com)
2. Sign up (free account)
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Fill in:
   - **Name**: study-comp-backend
   - **Runtime**: Python 3
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `python app.py`
6. Add environment variables from `.env.example`:
   - SUPABASE_URL
   - SUPABASE_KEY
   - OPENROUTER_API_KEY
7. Deploy! (takes ~2 min)

**Option 2: Railway**
1. Go to [railway.app](https://railway.app)
2. Sign up (free account, includes $5 free credits)
3. Click "New Project" → "Deploy from GitHub"
4. Select your repo
5. Add variables (same as above)
6. Deploy! (automatic)

---

### Frontend (HTML/CSS/JS) - Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up (free)
3. Click "New Project"
4. Import your GitHub repo
5. Configure:
   - **Framework Preset**: Other
   - **Build Command**: (leave blank, no build needed)
   - **Output Directory**: (leave blank)
6. Add environment variable:
   - `VITE_API_URL` = your backend URL from Render/Railway
7. Deploy! (takes ~1 min)

---

### Update Frontend API Calls

In your JS files, change API endpoints:

**Before:**
```javascript
fetch('http://localhost:5000/api/...')
```

**After:**
```javascript
fetch(process.env.VITE_API_URL + '/api/...')
// or hardcode the Render/Railway URL
```

---

## Your URLs After Deployment

- **Backend**: `https://study-comp-backend.onrender.com` (or Railway URL)
- **Frontend**: `https://study-comp.vercel.app` (or your custom domain)
- **Database**: Already live on Supabase

---

## Testing Locally First

```bash
docker-compose up
# Visit http://localhost:5000
```

---

## Cost Breakdown (Free Tier)

| Service | Cost | Notes |
|---------|------|-------|
| Vercel | Free | 100 GB bandwidth/month |
| Render | Free | 750 hours/month (never sleeps) |
| Railway | Free | $5 credits/month (never expires) |
| Supabase | Free | 500MB database |
| **Total** | **$0** | ✅ Fully free |

---

## Next Steps

1. Push to GitHub: `git push`
2. Deploy backend to Render
3. Get backend URL
4. Update frontend API calls
5. Deploy frontend to Vercel
6. Done! 🚀
