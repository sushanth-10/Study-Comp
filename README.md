# Scholarly — Study Companion

A local study app with notes, focus timer, streaks, **AI assistant**, and **topic-based quizzes**.

---

## What you need first

| Requirement | Notes |
|-------------|--------|
| **Python 3.10+** | [Download Python](https://www.python.org/downloads/) — on Windows, check **“Add Python to PATH”** during install |
| **Internet** | For AI search, YouTube suggestions, and quiz generation |
| **OpenAI API key** (optional) | Better AI chat and quizzes. The app still runs without it using Wikipedia/search fallbacks |

---

## Quick start (Windows)

### 1. Get the project

Clone or download the repo, then open a terminal in the project folder:

```text
Study-Comp/
```

Example:

```powershell
cd C:\Users\YourName\Desktop\kd\Study-Comp
```

### 2. Create a virtual environment (recommended)

```powershell
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` at the start of your terminal line.

### 3. Install dependencies

```powershell
pip install -r requirements.txt
```

### 4. Add your API key (optional but recommended)

**Where to enter the API key:** in a file named **`.env`** in the **project root** (`Study-Comp` folder).  
Do **not** put the key in `app.py`, HTML files, or GitHub.

**Steps:**

1. Copy the example file:
   ```powershell
   copy .env.example .env
   ```
2. Open **`.env`** in Notepad, VS Code, or Cursor.
3. Replace the placeholder with your real key:

   ```env
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   OPENAI_MODEL=gpt-4o-mini
   SECRET_KEY=any-random-secret-string-for-sessions
   ```

4. Save the file.

**Getting an OpenAI key:**

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in → **Create new secret key**
3. Paste it into `.env` as `OPENAI_API_KEY=...`

> **Security:** Never commit `.env` or share your key in Discord/chat. Each person should use their own key. `.env` is already in `.gitignore`.

### 5. Run the app

```powershell
python app.py
```

You should see:

```text
Scholarly running at http://127.0.0.1:5000
```

### 6. Open in the browser

Go to: **http://127.0.0.1:5000**

- **Sign up** or **log in** (any email/password works locally — accounts are stored in your browser session only).
- Use **Dashboard**, **Focus**, **Notes**, **Streak**, **AI Assistant**, and **Quiz** from the sidebar.

---

## Quick start (Mac / Linux)

```bash
cd path/to/Study-Comp
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
python app.py
```

Then open **http://127.0.0.1:5000**.

---

## What the API key enables

| Feature | Without API key | With API key in `.env` |
|---------|-----------------|-------------------------|
| Login, dashboard, focus, notes | Yes | Yes |
| AI Assistant (explain / search / videos) | Yes (Wikipedia + web search) | Yes + smarter GPT replies |
| Quiz generator | Yes (Wikipedia-based questions) | Yes + higher-quality GPT questions |

---

## Using the app

### AI Assistant (`/ai`)

- Ask to **explain** a topic, **search** the web, or **find YouTube videos**
- Use the quick-action chips or type your own question

### Quiz (`/quiz`)

1. Enter a **topic** (e.g. `Photosynthesis`, `World War II`)
2. Choose **Easy**, **Moderate**, or **Hard**
3. Pick **10–30** questions
4. Click **Generate Quiz**

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `'python' is not recognized` | Reinstall Python with “Add to PATH”, or use `py app.py` on Windows |
| `ModuleNotFoundError` | Activate `venv`, then run `pip install -r requirements.txt` again |
| AI/Quiz feels basic | Add `OPENAI_API_KEY` to `.env`, save, **restart** `python app.py` |
| Port already in use | Close other terminals running the app, or set `PORT=5001` before starting |
| Friends on another PC can’t connect | By default the app is local only. For LAN access, they need your IP and you must run with `host=0.0.0.0` (already set in `app.py`) and allow firewall access to port 5000 |

### Sharing on the same Wi‑Fi (optional)

If a friend on the same network wants to use your running instance:

1. Find your IP: `ipconfig` (Windows) → look for **IPv4 Address** (e.g. `192.168.1.5`)
2. They open: `http://192.168.1.5:5000`
3. You may need to allow Python through Windows Firewall when prompted

---

## Project structure (helpful paths)

```text
Study-Comp/
├── .env              ← PUT API KEYS HERE (create from .env.example)
├── .env.example      ← Template only (safe to share)
├── app.py            ← Run this to start the server
├── ai_service.py     ← AI chat logic
├── quiz_service.py   ← Quiz generation
├── requirements.txt  ← Python packages
├── AI_page.html      ← AI Assistant page
├── quiz.html         ← Quiz page
├── js/               ← Frontend scripts
└── css/              ← Styles
```

---

## Stopping the server

In the terminal where the app is running, press **Ctrl + C**.

---

## Need help?

1. Confirm Python: `python --version`
2. Confirm `.env` exists and has `OPENAI_API_KEY=sk-...`
3. Restart the server after changing `.env`
4. Check the terminal for error messages when something fails
