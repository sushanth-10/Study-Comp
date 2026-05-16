"""Scholarly study app — run locally with: python app.py"""
import os
from functools import wraps

ROOT = os.path.dirname(os.path.abspath(__file__))

try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(ROOT, ".env"))
except ImportError:
    pass

from flask import Flask, jsonify, redirect, request, send_from_directory, send_file, session, url_for

from ai_service import chat as ai_chat
from notes_service import delete_pdf, get_pdf_path, get_pdf_record, list_pdfs, save_pdf
from quiz_service import generate_quiz

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


def api_login_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if not session.get("logged_in"):
            return jsonify({"error": "Login required."}), 401
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


def _session_email():
    return session.get("email") or "local@scholarly.app"


@app.route("/api/notes/list")
@api_login_required
def api_notes_list():
    query = (request.args.get("q") or "").strip()
    return jsonify({"pdfs": list_pdfs(_session_email(), query)})


@app.route("/api/notes/upload", methods=["POST"])
@api_login_required
def api_notes_upload():
    file = request.files.get("file")
    try:
        record = save_pdf(_session_email(), file)
        return jsonify({"pdf": record}), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/notes/pdf/<pdf_id>")
@api_login_required
def api_notes_pdf(pdf_id):
    email = _session_email()
    record = get_pdf_record(pdf_id, email)
    path = get_pdf_path(pdf_id, email)
    if not record or not path:
        return jsonify({"error": "PDF not found."}), 404
    return send_file(
        path,
        mimetype="application/pdf",
        as_attachment=False,
        download_name=record.get("filename", "document.pdf"),
    )


@app.route("/api/notes/<pdf_id>", methods=["DELETE"])
@api_login_required
def api_notes_delete(pdf_id):
    if delete_pdf(pdf_id, _session_email()):
        return jsonify({"ok": True})
    return jsonify({"error": "PDF not found."}), 404


@app.route("/api/quiz/generate", methods=["POST"])
@login_required
def api_quiz_generate():
    data = request.get_json(silent=True) or {}
    topic = (data.get("topic") or "").strip()
    difficulty = (data.get("difficulty") or "moderate").strip().lower()
    try:
        count = int(data.get("count") or 15)
    except (TypeError, ValueError):
        count = 15
    try:
        return jsonify(generate_quiz(topic, difficulty, count))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/ai/chat", methods=["POST"])
@login_required
def api_ai_chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Message is required."}), 400
    try:
        return jsonify(ai_chat(message))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


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
