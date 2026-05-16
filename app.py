"""Scholarly study app — run locally with: python app.py"""
import os
from functools import wraps

from flask import Flask, redirect, request, send_from_directory, session, url_for

ROOT = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "scholarly-dev-secret-change-me")

# Pages that require login
PROTECTED = {
    "dashboard": "dashboard.html",
    "focus": "focus.html",
    "notes": "notes.html",
    "streak": "streak.html",
    "quiz": "quiz.html",
    "ai": "AI_page.html",
}

PUBLIC = {
    "login": "login.html",
    "signup": "signup.html",
}


def login_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if not session.get("logged_in"):
            return redirect(url_for("login"))
        return f(*args, **kwargs)

    return wrapped


def send_page(filename):
    return send_from_directory(ROOT, filename)


@app.route("/")
def index():
    if session.get("logged_in"):
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if session.get("logged_in"):
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        email = (request.form.get("email") or "").strip()
        password = (request.form.get("password") or "").strip()
        if not email or not password:
            return send_page("login.html"), 400
        session["logged_in"] = True
        session["email"] = email
        return redirect(url_for("dashboard"))

    return send_page("login.html")


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if session.get("logged_in"):
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        name = (request.form.get("full_name") or "").strip()
        email = (request.form.get("email") or "").strip()
        password = (request.form.get("password") or "").strip()
        if not name or not email or not password:
            return send_page("signup.html"), 400
        session["logged_in"] = True
        session["email"] = email
        session["name"] = name
        return redirect(url_for("dashboard"))

    return send_page("signup.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/dashboard")
@login_required
def dashboard():
    return send_page("dashboard.html")


@app.route("/focus")
@login_required
def focus():
    return send_page("focus.html")


@app.route("/notes")
@login_required
def notes():
    return send_page("notes.html")


@app.route("/streak")
@login_required
def streak():
    return send_page("streak.html")


@app.route("/quiz")
@login_required
def quiz():
    return send_page("quiz.html")


@app.route("/ai")
@login_required
def ai_page():
    return send_page("AI_page.html")


@app.route("/css/<path:filename>")
def css(filename):
    return send_from_directory(os.path.join(ROOT, "css"), filename)


@app.route("/js/<path:filename>")
def js(filename):
    return send_from_directory(os.path.join(ROOT, "js"), filename)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    print(f"\n  Scholarly running at http://127.0.0.1:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
