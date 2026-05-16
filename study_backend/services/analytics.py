"""Adaptive analytics, prediction, and behavioral intelligence."""
from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime, timedelta
from statistics import mean
from typing import Any

from sqlalchemy.orm import Session

from study_backend.models import (
    AdaptiveState,
    AnalyticsSnapshot,
    FatigueLog,
    FocusLog,
    MasteryScore,
    MoodEntry,
    Note,
    PerformanceMetric,
    QuizAttempt,
    Recommendation,
    StudySession,
    StudyStreak,
    User,
)
from study_backend.schemas import ActivityItem, AnalyticsOverviewResponse, DashboardOverview, FatigueResponse, InsightItem
from study_backend.services.openrouter import structured_completion


RANGE_DAYS = {"daily": 1, "weekly": 7, "monthly": 30, "yearly": 365}


def _recent_sessions(db: Session, user: User, days: int = 30) -> list[StudySession]:
    cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=days)
    return (
        db.query(StudySession)
        .filter(StudySession.user_id == user.id, StudySession.started_at >= cutoff)
        .order_by(StudySession.started_at.desc())
        .all()
    )


def _recent_quizzes(db: Session, user: User, days: int = 30) -> list[QuizAttempt]:
    cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=days)
    return (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user.id, QuizAttempt.created_at >= cutoff)
        .order_by(QuizAttempt.created_at.desc())
        .all()
    )


def _recent_moods(db: Session, user: User, days: int = 14) -> list[MoodEntry]:
    cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=days)
    return (
        db.query(MoodEntry)
        .filter(MoodEntry.user_id == user.id, MoodEntry.created_at >= cutoff)
        .order_by(MoodEntry.created_at.desc())
        .all()
    )


def _recent_focus_logs(db: Session, user: User, days: int = 30) -> list[FocusLog]:
    cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=days)
    return (
        db.query(FocusLog)
        .filter(FocusLog.user_id == user.id, FocusLog.created_at >= cutoff)
        .order_by(FocusLog.created_at.desc())
        .all()
    )


def _recent_fatigue_logs(db: Session, user: User, days: int = 30) -> list[FatigueLog]:
    cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=days)
    return (
        db.query(FatigueLog)
        .filter(FatigueLog.user_id == user.id, FatigueLog.created_at >= cutoff)
        .order_by(FatigueLog.created_at.desc())
        .all()
    )


def _clamp(value: float, floor: int = 0, ceil: int = 100) -> int:
    return max(floor, min(ceil, round(value)))


def _bucket_label(dt: datetime, range_name: str) -> str:
    if range_name == "daily":
        return dt.strftime("%H:00")
    if range_name == "weekly":
        return dt.strftime("%a")
    if range_name == "monthly":
        return dt.strftime("%d %b")
    return dt.strftime("%b")


def _aggregate_time_series(
    points: list[dict[str, Any]],
    range_name: str,
    value_key: str,
    timestamp_key: str = "timestamp",
) -> list[dict[str, Any]]:
    grouped: dict[str, list[float]] = defaultdict(list)
    for point in points:
        timestamp = point[timestamp_key]
        label = _bucket_label(timestamp, range_name)
        grouped[label].append(float(point.get(value_key, 0)))
    return [{"label": label, "value": round(mean(values), 2)} for label, values in grouped.items()]


def _consistency_score(sessions: list[StudySession], days: int = 7) -> int:
    today = datetime.now(UTC).replace(tzinfo=None).date()
    studied_days = {s.started_at.date() for s in sessions if s.started_at.date() >= today - timedelta(days=days - 1)}
    return _clamp((len(studied_days) / days) * 100)


def _learning_velocity(sessions: list[StudySession]) -> int:
    if not sessions:
        return 0
    units = [int(s.metadata_json.get("completed_topic_units", 1)) for s in sessions[:10]]
    avg_duration = mean(s.duration_minutes for s in sessions[:10])
    velocity = (sum(units) / max(1, len(units))) * 18 + max(0, 55 - avg_duration) * 0.4
    return _clamp(velocity)


def _fatigue_level(score: float) -> str:
    if score >= 70:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def _focus_quality_from_sessions(sessions: list[StudySession], focus_logs: list[FocusLog]) -> int:
    if focus_logs:
        return _clamp(mean(log.focus_quality_score for log in focus_logs[:10]))
    if not sessions:
        return 0
    value = mean(max(20, s.focus_score - s.interruptions * 6 - s.fatigue_score * 0.15) for s in sessions[:10])
    return _clamp(value)


def _cognitive_engagement(sessions: list[StudySession], quizzes: list[QuizAttempt], focus_logs: list[FocusLog]) -> int:
    if focus_logs:
        return _clamp(mean(log.cognitive_engagement_score for log in focus_logs[:10]))
    if not sessions and not quizzes:
        return 0
    session_component = mean(s.productivity_score for s in sessions[:10]) if sessions else 70
    quiz_component = mean((q.confidence_avg * 100) - q.response_time_avg for q in quizzes[:10]) if quizzes else 68
    return _clamp((session_component + quiz_component) / 2)


def _mastery_by_subject(quizzes: list[QuizAttempt]) -> dict[str, int]:
    grouped: dict[str, list[float]] = defaultdict(list)
    for quiz in quizzes:
        grouped[quiz.subject].append((quiz.score / max(1, quiz.total_questions)) * 100)
    return {subject: _clamp(mean(values)) for subject, values in grouped.items()}


def _top_weak_topics(quizzes: list[QuizAttempt]) -> list[str]:
    weakness: dict[str, list[float]] = defaultdict(list)
    for quiz in quizzes:
        weakness[quiz.topic].append((quiz.score / max(1, quiz.total_questions)) * 100)
        for area in quiz.weak_areas or []:
            weakness[str(area)].append((quiz.score / max(1, quiz.total_questions)) * 100 - 8)
    ranked = sorted(((topic, mean(scores)) for topic, scores in weakness.items()), key=lambda item: item[1])
    return [topic for topic, _ in ranked[:5]]


def compute_overview(db: Session, user: User) -> DashboardOverview:
    sessions = _recent_sessions(db, user)
    quizzes = _recent_quizzes(db, user)
    moods = _recent_moods(db, user)
    today = datetime.now(UTC).replace(tzinfo=None).date()

    today_minutes = sum(s.duration_minutes for s in sessions if s.started_at.date() == today)
    studied_days = sorted({s.started_at.date() for s in sessions}, reverse=True)
    streak = 0
    cursor = today
    while cursor in studied_days:
        streak += 1
        cursor -= timedelta(days=1)

    focus_logs = _recent_focus_logs(db, user, 14)
    focus_score = _focus_quality_from_sessions(sessions, focus_logs)
    velocity = _learning_velocity(sessions)
    quiz_mastery = [q.score / max(1, q.total_questions) for q in quizzes]
    mastery = _clamp((mean(quiz_mastery) if quiz_mastery else 0.7) * 100)
    topic_completion = min(100, _clamp((len(studied_days) / 14) * 100 + mastery * 0.25))
    fatigue = mean([s.fatigue_score for s in sessions[:7]]) if sessions else 25
    consistency = _consistency_score(sessions)

    if moods:
        fatigue = (fatigue + mean(m.fatigue * 20 for m in moods[:5])) / 2
        consistency = (consistency + mean(m.motivation * 20 for m in moods[:5])) / 2

    return DashboardOverview(
        studyHours=round(today_minutes / 60, 1),
        weeklyStreak=streak,
        focusScore=focus_score,
        learningVelocity=velocity,
        masteryLevel=mastery,
        topicCompletion=topic_completion,
        fatigueScore=_clamp(fatigue),
        weeklyConsistency=_clamp(consistency),
    )


def compute_activity(db: Session, user: User) -> list[ActivityItem]:
    sessions = _recent_sessions(db, user, days=10)[:6]
    quizzes = _recent_quizzes(db, user, days=14)[:4]
    notes = (
        db.query(Note)
        .filter(Note.user_id == user.id)
        .order_by(Note.updated_at.desc())
        .limit(4)
        .all()
    )
    items: list[ActivityItem] = []

    for session in sessions:
        items.append(
            ActivityItem(
                title=session.topic,
                subject=session.subject,
                timestamp=session.started_at,
                durationMinutes=session.duration_minutes,
                completion=min(100, round(session.productivity_score)),
                trend="up" if session.focus_score >= 80 else "stable",
            )
        )
    for quiz in quizzes:
        items.append(
            ActivityItem(
                title=f"{quiz.topic} quiz",
                subject=quiz.subject,
                timestamp=quiz.created_at,
                durationMinutes=int(quiz.response_time_avg * quiz.total_questions / 60),
                completion=round((quiz.score / max(1, quiz.total_questions)) * 100),
                trend="up" if quiz.confidence_avg >= 0.8 else "down",
            )
        )
    for note in notes:
        items.append(
            ActivityItem(
                title=note.title,
                subject=note.subject,
                timestamp=note.updated_at,
                durationMinutes=12,
                completion=72,
                trend="stable",
            )
        )

    items.sort(key=lambda item: item.timestamp, reverse=True)
    return items[:8]


def compute_notes_view(db: Session, user: User, query: str = "") -> dict:
    notes_query = db.query(Note).filter(Note.user_id == user.id)
    if query:
        like = f"%{query.lower()}%"
        notes_query = notes_query.filter(
            (Note.title.ilike(like)) | (Note.content.ilike(like)) | (Note.subject.ilike(like))
        )
    notes = notes_query.order_by(Note.updated_at.desc()).all()
    categories = sorted({note.subject for note in notes})
    return {
        "categories": categories,
        "notes": [
            {
                "id": note.id,
                "title": note.title,
                "subject": note.subject,
                "preview": note.summary or note.content[:180],
                "date": note.updated_at.strftime("%b %d, %Y"),
                "bookmarked": note.bookmarked,
                "tags": note.tags,
            }
            for note in notes
        ],
    }


def compute_focus_analytics(db: Session, user: User, range_name: str = "weekly") -> dict:
    days = RANGE_DAYS.get(range_name, 7)
    sessions = [s for s in _recent_sessions(db, user, days=days * 3) if s.session_type == "focus"]
    focus_logs = _recent_focus_logs(db, user, days=days * 3)
    if not sessions and not focus_logs:
        return {
            "completedSessions": 0,
            "averageFocusDuration": 0,
            "interruptions": 0,
            "productivityScore": 0,
            "focusQualityScore": 0,
            "cognitiveEngagementScore": 0,
            "distractedSessions": 0,
            "charts": {"focusTrend": [], "distractionTrend": [], "deepWorkTrend": []},
        }

    trend_points = [
        {
            "timestamp": s.started_at,
            "focusScore": round(s.focus_score),
            "minutes": s.duration_minutes,
            "interruptions": s.interruptions,
        }
        for s in reversed(sessions[: max(7, days)])
    ]
    distracted_sessions = len(
        [s for s in sessions if s.interruptions >= 3 or s.fatigue_score >= 55 or s.focus_score < 65]
    )
    focus_quality = _focus_quality_from_sessions(sessions, focus_logs)
    cognitive = _cognitive_engagement(sessions, [], focus_logs)

    return {
        "completedSessions": len([s for s in sessions if s.completed]),
        "averageFocusDuration": round(mean(s.duration_minutes for s in sessions), 1) if sessions else 0,
        "interruptions": sum(s.interruptions for s in sessions),
        "productivityScore": _clamp(mean(s.productivity_score for s in sessions) if sessions else 0),
        "focusQualityScore": focus_quality,
        "cognitiveEngagementScore": cognitive,
        "distractedSessions": distracted_sessions,
        "charts": {
            "focusTrend": _aggregate_time_series(trend_points, range_name, "focusScore"),
            "distractionTrend": _aggregate_time_series(trend_points, range_name, "interruptions"),
            "deepWorkTrend": _aggregate_time_series(trend_points, range_name, "minutes"),
        },
    }


def compute_streak_view(db: Session, user: User) -> dict:
    sessions = _recent_sessions(db, user, days=40)
    counts: dict[str, int] = defaultdict(int)
    for session in sessions:
        counts[session.started_at.date().isoformat()] += 1
    overview = compute_overview(db, user)
    streak = overview.weeklyStreak
    engagement_prediction = _clamp(overview.weeklyConsistency * 0.6 + overview.learningVelocity * 0.4)
    return {
        "currentStreak": streak,
        "weeklyStreak": min(7, streak),
        "consistencyScore": overview.weeklyConsistency,
        "milestone": "Momentum Builder" if streak >= 10 else "On Track",
        "engagementPrediction": engagement_prediction,
        "monthActivity": counts,
        "totalStudyHours": round(sum(s.duration_minutes for s in sessions) / 60, 1),
        "rank": max(1, 25 - streak),
        "achievements": [
            {
                "title": "7 Day Sprint",
                "unlocked": streak >= 7,
                "description": "Consistent work for a full week.",
            },
            {
                "title": "Quiz Master",
                "unlocked": db.query(QuizAttempt).filter(QuizAttempt.user_id == user.id).count() >= 3,
                "description": "Multiple adaptive quizzes completed.",
            },
            {
                "title": "Morning Momentum",
                "unlocked": any(s.started_at.hour < 10 for s in sessions),
                "description": "Strong early-day focus habits.",
            },
        ],
    }


def _insight_payload(db: Session, user: User) -> dict[str, Any]:
    overview = compute_overview(db, user)
    quizzes = _recent_quizzes(db, user)
    sessions = _recent_sessions(db, user)
    moods = _recent_moods(db, user)
    focus = compute_focus_analytics(db, user)
    fatigue = compute_fatigue_analytics(db, user)
    return {
        "overview": overview.model_dump(),
        "focus": focus,
        "fatigue": fatigue.model_dump(),
        "quizzes": [
            {
                "topic": q.topic,
                "subject": q.subject,
                "accuracy": round((q.score / max(1, q.total_questions)) * 100),
                "response_time_avg": q.response_time_avg,
                "confidence": q.confidence_avg,
            }
            for q in quizzes[:8]
        ],
        "sessions": [
            {
                "topic": s.topic,
                "subject": s.subject,
                "focus_score": s.focus_score,
                "fatigue_score": s.fatigue_score,
                "duration": s.duration_minutes,
                "hour": s.started_at.hour,
            }
            for s in sessions[:10]
        ],
        "moods": [
            {
                "stress": m.stress,
                "motivation": m.motivation,
                "fatigue": m.fatigue,
                "confidence": m.confidence,
                "created_at": m.created_at.isoformat(),
            }
            for m in moods[:5]
        ],
    }


def compute_insights(db: Session, user: User) -> list[InsightItem]:
    overview = compute_overview(db, user)
    sessions = _recent_sessions(db, user)
    morning_scores = [s.focus_score for s in sessions if s.started_at.hour < 12]
    evening_scores = [s.focus_score for s in sessions if s.started_at.hour >= 18]
    morning_delta = round(mean(morning_scores) - mean(evening_scores)) if morning_scores and evening_scores else 0

    heuristic = [
        InsightItem(
            title="Peak performance window",
            message=(
                f"You perform about {abs(morning_delta)}% better in the morning."
                if morning_delta > 0
                else "Your strongest sessions happen when you start earlier and keep them under 50 minutes."
            ),
            metric=f"Focus score is {overview.focusScore}/100.",
            severity="info",
        ),
        InsightItem(
            title="Retention pattern",
            message="Concept-heavy topics soften after long sessions, so break them into shorter review cycles.",
            metric=f"Fatigue score is {overview.fatigueScore}/100.",
            severity="warning" if overview.fatigueScore >= 45 else "info",
        ),
        InsightItem(
            title="Quiz momentum",
            message="Accuracy improves after deliberate breaks and drops when interruptions stack up.",
            metric=f"Recent mastery is {overview.masteryLevel}%.",
            severity="success" if overview.masteryLevel >= 75 else "warning",
        ),
    ]

    ai_data = structured_completion(
        "insight",
        "Generate 2-3 concise personalized study insights grounded in study timing, focus duration, quiz performance, fatigue, mood trends, and learning velocity.",
        '{"insights":[{"title":"string","message":"string","metric":"string","severity":"info|warning|success"}]}',
        _insight_payload(db, user),
    )
    ai_items = [InsightItem(**item) for item in ai_data.get("insights", []) if isinstance(item, dict)]
    return (ai_items or heuristic)[:3]


def compute_analytics_overview(db: Session, user: User, range_name: str = "weekly") -> AnalyticsOverviewResponse:
    days = RANGE_DAYS.get(range_name, 7)
    sessions = _recent_sessions(db, user, days=days * 2)
    quizzes = _recent_quizzes(db, user, days=days * 2)
    focus_logs = _recent_focus_logs(db, user, days=days * 2)
    overview = compute_overview(db, user)

    accuracy = mean([(q.score / max(1, q.total_questions)) * 100 for q in quizzes]) if quizzes else overview.masteryLevel
    first_half = quizzes[len(quizzes) // 2 :] if quizzes else []
    second_half = quizzes[: len(quizzes) // 2] if quizzes else []
    early = mean([(q.score / max(1, q.total_questions)) * 100 for q in first_half]) if first_half else accuracy
    recent = mean([(q.score / max(1, q.total_questions)) * 100 for q in second_half]) if second_half else accuracy
    weekly_improvement = _clamp(recent - early + 50) - 50

    chart_points = [
        {
            "timestamp": q.created_at,
            "accuracy": round((q.score / max(1, q.total_questions)) * 100),
            "confidence": round(q.confidence_avg * 100),
        }
        for q in quizzes
    ] + [
        {
            "timestamp": s.started_at,
            "accuracy": round(s.productivity_score),
            "confidence": round(s.focus_score),
        }
        for s in sessions
    ]

    return AnalyticsOverviewResponse(
        accuracy=_clamp(accuracy),
        masteryScore=overview.masteryLevel,
        weeklyImprovement=weekly_improvement,
        consistencyScore=overview.weeklyConsistency,
        learningVelocity=overview.learningVelocity,
        focusQuality=_focus_quality_from_sessions(sessions, focus_logs),
        cognitiveEngagement=_cognitive_engagement(sessions, quizzes, focus_logs),
        charts={
            "line": _aggregate_time_series(chart_points, range_name, "accuracy"),
            "confidence": _aggregate_time_series(chart_points, range_name, "confidence"),
        },
    )


def compute_performance_analytics(db: Session, user: User, range_name: str = "weekly") -> dict:
    days = RANGE_DAYS.get(range_name, 7)
    quizzes = _recent_quizzes(db, user, days=days * 3)
    sessions = _recent_sessions(db, user, days=days * 3)
    focus_logs = _recent_focus_logs(db, user, days=days * 3)

    accuracies = [(q.score / max(1, q.total_questions)) * 100 for q in quizzes]
    response_times = [q.response_time_avg for q in quizzes]
    confidences = [q.confidence_avg * 100 for q in quizzes]
    completion_rate = mean(
        [
            (q.result_payload.get("answered", q.total_questions - q.result_payload.get("skipped", 0)) / max(1, q.total_questions))
            * 100
            for q in quizzes
        ]
    ) if quizzes else mean(s.productivity_score for s in sessions) if sessions else 0
    retry_frequency = mean(q.result_payload.get("retry_frequency", 0.15) for q in quizzes) if quizzes else 0.12
    hesitation_rate = len([t for t in response_times if t > 22]) / max(1, len(response_times))
    fast_guess_rate = len([t for t in response_times if t < 8]) / max(1, len(response_times))

    chart_points = [
        {
            "timestamp": q.created_at,
            "accuracy": round((q.score / max(1, q.total_questions)) * 100),
            "responseTime": q.response_time_avg,
            "confidence": round(q.confidence_avg * 100),
        }
        for q in quizzes
    ]
    focus_quality = _focus_quality_from_sessions(sessions, focus_logs)
    cognitive = _cognitive_engagement(sessions, quizzes, focus_logs)

    ai_data = structured_completion(
        "performance",
        "Predict future weak areas, exam readiness, best study timing, ideal study duration, and decline risk from these performance trends.",
        '{"performance":{"weakFutureTopics":["string"],"examReadiness":0,"idealStudyDuration":0,"bestStudyTiming":"string","predictedDeclineRisk":0}}',
        {
            "range": range_name,
            "accuracy": accuracies[:12],
            "response_times": response_times[:12],
            "confidence": confidences[:12],
            "weak_topics": _top_weak_topics(quizzes),
            "focus_quality": focus_quality,
            "cognitive_engagement": cognitive,
        },
    )
    predicted = ai_data.get("performance", {})

    return {
        "accuracy": _clamp(mean(accuracies) if accuracies else 0),
        "masteryScore": _clamp(mean(confidences) if confidences else 0),
        "completionRate": _clamp(completion_rate),
        "responseSpeed": round(mean(response_times), 2) if response_times else 0,
        "confidenceTrend": _clamp(mean(confidences) if confidences else 0),
        "consistencyScore": _consistency_score(sessions, max(7, days)),
        "sessionDuration": round(mean(s.duration_minutes for s in sessions), 1) if sessions else 0,
        "retryFrequency": round(retry_frequency, 2),
        "hesitationPatterns": {
            "hesitationRate": round(hesitation_rate, 2),
            "fastGuessRate": round(fast_guess_rate, 2),
            "deepThinkingRate": round(1 - fast_guess_rate - min(0.5, hesitation_rate / 2), 2),
        },
        "focusQualityScore": focus_quality,
        "cognitiveEngagementScore": cognitive,
        "predictive": predicted,
        "charts": {
            "accuracyLine": _aggregate_time_series(chart_points, range_name, "accuracy"),
            "responseTimeLine": _aggregate_time_series(chart_points, range_name, "responseTime"),
            "confidenceLine": _aggregate_time_series(chart_points, range_name, "confidence"),
        },
    }


def compute_mastery_analytics(db: Session, user: User, range_name: str = "weekly") -> dict:
    quizzes = _recent_quizzes(db, user, days=RANGE_DAYS.get(range_name, 7) * 4)
    subject_map = _mastery_by_subject(quizzes)
    topic_scores: dict[str, list[float]] = defaultdict(list)
    for quiz in quizzes:
        topic_scores[quiz.topic].append((quiz.score / max(1, quiz.total_questions)) * 100)
    topics = [
        {
            "topic": topic,
            "mastery": _clamp(mean(scores)),
            "confidence": _clamp(mean((q.confidence_avg * 100) for q in quizzes if q.topic == topic)),
            "revisionPriority": min(5, max(1, 5 - round(mean(scores) / 20))),
        }
        for topic, scores in topic_scores.items()
    ]
    topics.sort(key=lambda item: item["mastery"])
    return {
        "subjectMastery": subject_map,
        "strongTopics": [item for item in topics if item["mastery"] >= 85][:5],
        "weakTopics": [item for item in topics if item["mastery"] < 75][:5],
        "partialTopics": [item for item in topics if 75 <= item["mastery"] < 85][:5],
        "repeatedMistakes": _top_weak_topics(quizzes),
        "charts": {
            "heatmap": [
                {"topic": item["topic"], "value": item["mastery"], "confidence": item["confidence"]}
                for item in topics[:10]
            ],
            "radar": [{"label": subject, "value": score} for subject, score in subject_map.items()],
        },
    }


def compute_fatigue_analytics(db: Session, user: User, range_name: str = "weekly") -> FatigueResponse:
    days = RANGE_DAYS.get(range_name, 7)
    sessions = _recent_sessions(db, user, days=days * 3)
    quizzes = _recent_quizzes(db, user, days=days * 3)
    moods = _recent_moods(db, user, days=days * 3)
    fatigue_logs = _recent_fatigue_logs(db, user, days=days * 3)

    if fatigue_logs:
        fatigue_score = mean(log.fatigue_score for log in fatigue_logs[:10])
        burnout_risk = mean(log.burnout_risk for log in fatigue_logs[:10])
        frustration = mean(log.frustration_index for log in fatigue_logs[:10])
    else:
        late_sessions = [s for s in sessions if s.started_at.hour >= 20]
        slowing = mean(q.response_time_avg for q in quizzes[:5]) if quizzes else 16
        fatigue_score = mean(s.fatigue_score for s in sessions[:8]) if sessions else 28
        fatigue_score += len(late_sessions) * 3
        fatigue_score += max(0, slowing - 16) * 1.6
        burnout_risk = fatigue_score * 0.7 + (mean(m.stress for m in moods) * 7 if moods else 10)
        frustration = max(8, burnout_risk * 0.7 - (mean(m.confidence for m in moods) * 4 if moods else 8))

    ai_data = structured_completion(
        "burnout",
        "Predict fatigue level, burnout risk, frustration index, and recommended action from these study patterns.",
        '{"fatigueLevel":"low|medium|high","burnoutRisk":0,"recommendedAction":"string","frustrationIndex":0}',
        {
            "session_fatigue": [s.fatigue_score for s in sessions[:10]],
            "response_times": [q.response_time_avg for q in quizzes[:10]],
            "mood_fatigue": [m.fatigue for m in moods[:10]],
            "stress": [m.stress for m in moods[:10]],
        },
    )
    chart_points = [
        {"timestamp": s.started_at, "fatigue": s.fatigue_score, "burnout": min(100, s.fatigue_score * 1.4)}
        for s in sessions[:14]
    ]
    return FatigueResponse(
        fatigueLevel=str(ai_data.get("fatigueLevel") or _fatigue_level(fatigue_score)),
        burnoutRisk=_clamp(ai_data.get("burnoutRisk", burnout_risk)),
        recommendedAction=str(ai_data.get("recommendedAction") or ("take_break" if fatigue_score >= 45 else "continue")),
        frustrationIndex=_clamp(ai_data.get("frustrationIndex", frustration)),
        charts={
            "fatigueTrend": _aggregate_time_series(chart_points, range_name, "fatigue"),
            "burnoutTrend": _aggregate_time_series(chart_points, range_name, "burnout"),
        },
    )


def compute_recommendations(db: Session, user: User, range_name: str = "weekly") -> dict:
    performance = compute_performance_analytics(db, user, range_name)
    fatigue = compute_fatigue_analytics(db, user, range_name)
    mastery = compute_mastery_analytics(db, user, range_name)
    payload = {
        "performance": performance,
        "fatigue": fatigue.model_dump(),
        "weakTopics": mastery["weakTopics"],
        "strongTopics": mastery["strongTopics"],
    }
    ai_data = structured_completion(
        "recommendation",
        "Generate personalized adaptive study recommendations and revision priorities.",
        '{"recommendations":[{"recommendedTopic":"string","reason":"string","recommendedSessionLength":0,"priority":0}]}',
        payload,
    )
    recommendations = ai_data.get("recommendations", [])
    if not recommendations:
        weak = mastery["weakTopics"][0]["topic"] if mastery["weakTopics"] else "Revision Focus"
        recommendations = [
            {
                "recommendedTopic": weak,
                "reason": "Accuracy is softer here and focus stays strong in shorter blocks.",
                "recommendedSessionLength": 45,
                "priority": 1,
            }
        ]
    return {
        "items": recommendations,
        "recommendedTopic": recommendations[0]["recommendedTopic"],
        "reason": recommendations[0]["reason"],
        "recommendedSessionLength": recommendations[0]["recommendedSessionLength"],
    }


def persist_analytics_artifacts(
    db: Session,
    user: User,
    session: StudySession | None = None,
    quiz: QuizAttempt | None = None,
    source_payload: dict[str, Any] | None = None,
) -> None:
    source_payload = source_payload or {}
    sessions = _recent_sessions(db, user, 30)
    quizzes = _recent_quizzes(db, user, 30)
    overview = compute_analytics_overview(db, user, "weekly")
    fatigue = compute_fatigue_analytics(db, user, "weekly")
    performance = compute_performance_analytics(db, user, "weekly")
    mastery = compute_mastery_analytics(db, user, "weekly")
    recommendations = compute_recommendations(db, user, "weekly")

    db.add(
        AnalyticsSnapshot(
            user_id=user.id,
            period="weekly",
            accuracy=overview.accuracy,
            mastery_score=overview.masteryScore,
            weekly_improvement=overview.weeklyImprovement,
            consistency_score=overview.consistencyScore,
            cognitive_engagement=overview.cognitiveEngagement,
            payload=overview.model_dump(),
        )
    )

    if session:
        db.add(
            FocusLog(
                user_id=user.id,
                session_id=session.id,
                uninterrupted_minutes=max(5, session.duration_minutes - source_payload.get("idleSeconds", 0) / 60),
                interruptions=session.interruptions,
                idle_seconds=source_payload.get("idleSeconds", 0),
                tab_switches=source_payload.get("tabSwitches", 0),
                focus_quality_score=max(0, session.focus_score - source_payload.get("tabSwitches", 0) * 2),
                cognitive_engagement_score=max(0, session.productivity_score - source_payload.get("idleSeconds", 0) / 30),
                payload=source_payload,
            )
        )
        db.add(
            FatigueLog(
                user_id=user.id,
                session_id=session.id,
                fatigue_score=session.fatigue_score,
                burnout_risk=fatigue.burnoutRisk,
                frustration_index=fatigue.frustrationIndex,
                recommended_action=fatigue.recommendedAction,
                payload=source_payload,
            )
        )

    if quiz:
        score_pct = (quiz.score / max(1, quiz.total_questions)) * 100
        db.add(
            PerformanceMetric(
                user_id=user.id,
                subject=quiz.subject,
                topic=quiz.topic,
                accuracy=score_pct,
                completion_rate=source_payload.get("completionRate", 100),
                response_speed=quiz.response_time_avg,
                confidence_trend=quiz.confidence_avg * 100,
                retry_frequency=source_payload.get("retryFrequency", 0.15),
                payload=source_payload,
            )
        )
        existing = (
            db.query(MasteryScore)
            .filter(MasteryScore.user_id == user.id, MasteryScore.topic == quiz.topic)
            .order_by(MasteryScore.updated_at.desc())
            .first()
        )
        if existing:
            existing.mastery_score = (existing.mastery_score * existing.attempt_count + score_pct) / (existing.attempt_count + 1)
            existing.confidence_score = (existing.confidence_score * existing.attempt_count + quiz.confidence_avg * 100) / (existing.attempt_count + 1)
            existing.attempt_count += 1
            existing.revision_priority = min(5, max(1, 5 - round(existing.mastery_score / 20)))
            existing.payload = {"weak_areas": quiz.weak_areas}
        else:
            db.add(
                MasteryScore(
                    user_id=user.id,
                    subject=quiz.subject,
                    topic=quiz.topic,
                    mastery_score=score_pct,
                    confidence_score=quiz.confidence_avg * 100,
                    revision_priority=min(5, max(1, 5 - round(score_pct / 20))),
                    attempt_count=1,
                    payload={"weak_areas": quiz.weak_areas},
                )
            )

    top_rec = recommendations["items"][0] if recommendations["items"] else None
    if top_rec:
        db.add(
            Recommendation(
                user_id=user.id,
                category="analytics",
                recommended_topic=top_rec["recommendedTopic"],
                reason=top_rec["reason"],
                recommended_session_length=int(top_rec["recommendedSessionLength"]),
                priority=int(top_rec.get("priority", 2)),
                payload=recommendations,
            )
        )

    streak_view = compute_streak_view(db, user)
    existing_streak = (
        db.query(StudyStreak)
        .filter(StudyStreak.user_id == user.id, StudyStreak.streak_type == "daily")
        .order_by(StudyStreak.updated_at.desc())
        .first()
    )
    if existing_streak:
        existing_streak.current_value = streak_view["currentStreak"]
        existing_streak.best_value = max(existing_streak.best_value, streak_view["currentStreak"])
        existing_streak.milestone_label = streak_view["milestone"]
        existing_streak.engagement_prediction = streak_view["engagementPrediction"]
        existing_streak.payload = streak_view
    else:
        db.add(
            StudyStreak(
                user_id=user.id,
                streak_type="daily",
                current_value=streak_view["currentStreak"],
                best_value=streak_view["currentStreak"],
                milestone_label=streak_view["milestone"],
                engagement_prediction=streak_view["engagementPrediction"],
                payload=streak_view,
            )
        )

    state = (
        db.query(AdaptiveState)
        .filter(AdaptiveState.user_id == user.id, AdaptiveState.subject == "General")
        .order_by(AdaptiveState.updated_at.desc())
        .first()
    )
    if state:
        state.mastery_level = overview.masteryScore / 100
        state.fatigue_level = fatigue.burnoutRisk / 100
        state.confidence_level = performance["confidenceTrend"] / 100
        state.learning_velocity = overview.learningVelocity / 100
        state.weak_topics = _top_weak_topics(quizzes)
        state.payload = {
            "focus_quality": overview.focusQuality,
            "cognitive_engagement": overview.cognitiveEngagement,
            "recommendations": recommendations["items"][:3],
        }
