"""Scholarly study app — run locally with: python app.py"""
import os
import re
from datetime import datetime, timedelta
from functools import wraps

ROOT = os.path.dirname(os.path.abspath(__file__))

try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(ROOT, ".env"))
except ImportError:
    pass

from flask import Flask, jsonify, redirect, request, send_file, send_from_directory, session, url_for

from ai_service import chat as ai_chat
from ai_service import scan_file_for_topic
from notes_service import delete_pdf, get_pdf_path, get_pdf_record, list_pdfs, save_pdf
from quiz_service import generate_quiz

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "scholarly-dev-secret-change-me")

# Pages that require login
PROTECTED = {
    "dashboard": "dashboard.html",
    "analytics": "analytics.html",
    "planner": "planner.html",
    "focus": "focus.html",
    "notes": "notes.html",
    "streak": "streak.html",
    "quiz": "quiz.html",
    "ai": "AI_page.html",
    "visual": "visual.html",
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


@app.route("/analytics")
@login_required
def analytics():
    return send_page("analytics.html")


@app.route("/planner")
@login_required
def planner():
    return send_page("planner.html")


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


@app.route("/visual")
@login_required
def visual():
    return send_page("visual.html")


@app.route("/api/session")
@login_required
def api_session():
    return jsonify({
        "user": {
            "name": session.get("name") or "Scholar",
            "email": session.get("email", ""),
            "avatarUrl": "",
        }
    })


@app.route("/api/dashboard/overview")
@login_required
def api_dashboard_overview():
    return jsonify({
        "studyHours": 1.2,
        "weeklyStreak": 6,
        "focusScore": 83,
        "learningVelocity": 76,
        "masteryLevel": 78,
        "topicCompletion": 70,
        "fatigueScore": 24,
        "weeklyConsistency": 88,
    })


@app.route("/api/dashboard/activity")
@login_required
def api_dashboard_activity():
    now = datetime.utcnow()
    return jsonify({"items": [
        {"title": "Review Calculus - Derivatives", "subject": "Mathematics", "timestamp": now.isoformat(), "durationMinutes": 45, "completion": 70, "trend": "up"},
        {"title": "Organic Chemistry practice", "subject": "Chemistry", "timestamp": (now - timedelta(hours=3)).isoformat(), "durationMinutes": 35, "completion": 62, "trend": "stable"},
    ]})


@app.route("/api/dashboard/insights")
@login_required
def api_dashboard_insights():
    return jsonify({"items": [
        {"title": "Evening focus window", "message": "Your best study rhythm appears after a short planning step.", "metric": "83 focus", "severity": "success"},
        {"title": "Chemistry review", "message": "A shorter review loop will help with reaction mechanisms.", "metric": "needs practice", "severity": "warning"},
    ]})


@app.route("/api/notes/list")
@login_required
def api_notes_list():
    q = (request.args.get("q") or "").strip()
    return jsonify({"pdfs": list_pdfs(session.get("email", ""), q)})


@app.route("/api/notes/upload", methods=["POST"])
@login_required
def api_notes_upload():
    file = request.files.get("file")
    try:
        record = save_pdf(session.get("email", ""), file)
        return jsonify({"pdf": record}), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/notes/pdf/<pdf_id>")
@login_required
def api_notes_pdf(pdf_id):
    record = get_pdf_record(pdf_id, session.get("email", ""))
    path = get_pdf_path(pdf_id, session.get("email", ""))
    if not record or not path:
        return jsonify({"error": "PDF not found."}), 404
    return send_file(path, mimetype="application/pdf", download_name=record.get("filename", "document.pdf"))


@app.route("/api/notes/<pdf_id>", methods=["DELETE"])
@login_required
def api_notes_delete(pdf_id):
    if delete_pdf(pdf_id, session.get("email", "")):
        return jsonify({"ok": True})
    return jsonify({"error": "PDF not found."}), 404


@app.route("/api/ai/scan-file", methods=["POST"])
@login_required
def api_ai_scan_file():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file provided."}), 400
    try:
        content = file.read()
        context_text, topic = scan_file_for_topic(content, file.content_type or "application/octet-stream")
        return jsonify({"topic": topic, "context": context_text})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/concept-map/generate", methods=["POST"])
@login_required
def api_concept_map_generate():
    data = request.get_json(silent=True) or {}
    topic = (data.get("topic") or "Study Topic").strip()
    clean = re.sub(r"[^A-Za-z0-9 ]+", "", topic)
    parts = [
        ("core", clean or "Topic"),
        ("terms", "Key terms"),
        ("why", "Why it matters"),
        ("practice", "Practice questions"),
        ("review", "Review plan"),
        ("weak", "Common weak points"),
    ]
    nodes = [{"id": key, "label": label, "type": "core" if key == "core" else "branch"} for key, label in parts]
    edges = [
        {"source": "core", "target": "terms", "label": "define"},
        {"source": "core", "target": "why", "label": "understand"},
        {"source": "core", "target": "practice", "label": "apply"},
        {"source": "practice", "target": "review", "label": "improve"},
        {"source": "review", "target": "weak", "label": "target"},
    ]
    return jsonify({"nodes": nodes, "edges": edges})


@app.route("/api/streak")
@login_required
def api_streak():
    today = datetime.now().date()
    month_activity = {}
    for i in range(10):
        day = today - timedelta(days=i)
        month_activity[day.isoformat()] = 1
    return jsonify({
        "currentStreak": 10,
        "weeklyStreak": 7,
        "bestStreak": 14,
        "milestone": "Momentum Builder",
        "totalStudyHours": 18,
        "monthActivity": month_activity,
        "consistencyScore": 88,
        "rank": 8,
        "engagementPrediction": 86,
        "achievements": [
            {"title": "7 Day Sprint", "description": "Consistent work for a full week.", "unlocked": True},
            {"title": "Quiz Master", "description": "Completed strong practice rounds.", "unlocked": True},
            {"title": "Night Owl", "description": "Finished sessions after dinner.", "unlocked": True},
            {"title": "Scholarly Elite", "description": "Keep going to unlock!", "unlocked": False},
        ],
    })


@app.route("/api/analytics/update", methods=["POST"])
@login_required
def api_analytics_update():
    return jsonify({"ok": True})


@app.route("/api/analytics/overview")
@login_required
def api_analytics_overview():
    return jsonify({
        "accuracy": 82,
        "masteryScore": 78,
        "weeklyImprovement": 7,
        "consistencyScore": 88,
        "learningVelocity": 74,
        "focusQuality": 83,
        "cognitiveEngagement": 80,
        "charts": {"line": [
            {"label": "Mon", "value": 70},
            {"label": "Tue", "value": 76},
            {"label": "Wed", "value": 79},
            {"label": "Thu", "value": 82},
            {"label": "Fri", "value": 86},
        ]},
    })


@app.route("/api/analytics/performance")
@login_required
def api_analytics_performance():
    return jsonify({
        "completionRate": 87,
        "responseSpeed": 15.4,
        "charts": {"accuracyLine": [
            {"label": "Mon", "value": 70},
            {"label": "Tue", "value": 76},
            {"label": "Wed", "value": 79},
            {"label": "Thu", "value": 82},
            {"label": "Fri", "value": 86},
        ]},
        "hesitationPatterns": {"deepThinkingRate": 0.58, "fastGuessRate": 0.16},
        "predictive": {
            "bestStudyTiming": "Evening focus window",
            "examReadiness": 82,
            "weakFutureTopics": ["Reaction mechanisms", "Concept recall"],
        },
    })


@app.route("/api/analytics/focus")
@login_required
def api_analytics_focus():
    return jsonify({"distractedSessions": 2, "focusQualityScore": 83})


@app.route("/api/focus/analytics")
@login_required
def api_focus_analytics():
    return jsonify({
        "completedSessions": 6,
        "averageFocusDuration": 34,
        "productivityScore": 82,
        "distractedSessions": 2,
        "focusQualityScore": 83,
    })


@app.route("/api/analytics/mastery")
@login_required
def api_analytics_mastery():
    return jsonify({
        "weakTopics": ["Reaction mechanisms", "Concept recall"],
        "charts": {"heatmap": [
            {"topic": "Calculus", "value": 84, "confidence": 80},
            {"topic": "Chemistry", "value": 68, "confidence": 62},
            {"topic": "Physics", "value": 78, "confidence": 74},
            {"topic": "Biology", "value": 86, "confidence": 82},
            {"topic": "English", "value": 81, "confidence": 77},
            {"topic": "Economics", "value": 73, "confidence": 70},
        ]},
    })


@app.route("/api/analytics/fatigue")
@login_required
def api_analytics_fatigue():
    return jsonify({
        "fatigueLevel": "low",
        "burnoutRisk": 24,
        "recommendedAction": "take_short_breaks",
        "frustrationIndex": 18,
        "charts": {"fatigueTrend": [
            {"label": "Mon", "value": 35},
            {"label": "Tue", "value": 30},
            {"label": "Wed", "value": 26},
            {"label": "Thu", "value": 22},
            {"label": "Fri", "value": 24},
        ]},
    })


@app.route("/api/analytics/streaks")
@login_required
def api_analytics_streaks():
    return api_streak()


@app.route("/api/analytics/recommendations")
@login_required
def api_analytics_recommendations():
    return jsonify({"items": [
        {"recommendedTopic": "Reaction mechanisms", "recommendedSessionLength": 35, "reason": "Accuracy is softer here than other topics."},
        {"recommendedTopic": "Formula recall", "recommendedSessionLength": 20, "reason": "Short drills will improve speed."},
        {"recommendedTopic": "Weekly review", "recommendedSessionLength": 25, "reason": "Keeps streak and retention stable."},
    ]})


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
        context = (data.get("context") or "").strip()
        return jsonify(generate_quiz(topic, difficulty, count, context))
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
