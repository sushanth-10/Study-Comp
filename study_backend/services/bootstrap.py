"""Seed realistic demo telemetry for first-time users."""
from __future__ import annotations

from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Session

from study_backend.models import (
    AdaptiveState,
    AnalyticsSnapshot,
    FatigueLog,
    Flashcard,
    FocusLog,
    MasteryScore,
    MoodEntry,
    Note,
    PerformanceMetric,
    QuizAttempt,
    Recommendation,
    StudyPlan,
    StudySession,
    StudyStreak,
    User,
)


def ensure_seed_data(db: Session, user: User) -> None:
    if db.query(StudySession).filter(StudySession.user_id == user.id).first():
        return

    now = datetime.now()
    subjects = [
        ("Economics", "Advanced Microeconomics", 52, 84, 79, 28, 1),
        ("Chemistry", "Organic Chemistry - Alkanes", 45, 81, 77, 35, 2),
        ("Biology", "Cellular Respiration", 38, 88, 80, 22, 0),
        ("Physics", "Neural Plasticity", 33, 72, 68, 44, 3),
        ("History", "Keynesian Theory Overview", 29, 76, 73, 31, 1),
    ]

    for index in range(12):
        subject, topic, duration, focus, productivity, fatigue, interruptions = subjects[index % len(subjects)]
        started_at = now - timedelta(days=11 - index, hours=8 - (index % 4))
        db.add(
            StudySession(
                user_id=user.id,
                subject=subject,
                topic=topic,
                duration_minutes=duration,
                focus_score=focus,
                productivity_score=productivity,
                fatigue_score=fatigue,
                interruptions=interruptions,
                session_type="focus" if index % 2 == 0 else "study",
                started_at=started_at,
                ended_at=started_at + timedelta(minutes=duration),
                metadata_json={"completed_topic_units": 1 + (index % 3), "goal_minutes": 50},
            )
        )

    attempts = [
        ("Advanced Microeconomics", "Economics", "hard", 8, 10, 0.82, 15.4),
        ("Organic Chemistry - Alkanes", "Chemistry", "moderate", 11, 15, 0.75, 18.8),
        ("Cellular Respiration", "Biology", "moderate", 12, 15, 0.84, 13.2),
    ]
    for topic, subject, difficulty, score, total, confidence, response in attempts:
        db.add(
            QuizAttempt(
                user_id=user.id,
                topic=topic,
                subject=subject,
                difficulty=difficulty,
                score=score,
                total_questions=total,
                confidence_avg=confidence,
                response_time_avg=response,
                fatigue_indicator=max(0.1, 1 - confidence),
                weak_areas=["retention", "application"] if confidence < 0.8 else ["speed"],
            )
        )

    notes = [
        (
            "Keynesian Theory Overview",
            "Economics",
            "Aggregate demand, multiplier effect, and fiscal stimulus interact most strongly during recessionary gaps.",
            "Keynesian models explain how government spending can stabilize demand during downturns.",
            ["macro", "exam-1"],
        ),
        (
            "Neural Plasticity Research",
            "Biology",
            "Synaptic strengthening rises when recall practice is spaced and sleep quality is high.",
            "Retention improves when spaced practice and sleep are paired.",
            ["memory", "neuroscience"],
        ),
        (
            "Organic Chemistry - Alkanes",
            "Chemistry",
            "Review substitution vs elimination triggers, steric hindrance, and reaction conditions.",
            "Focus on mechanism triggers and how conditions shift the dominant pathway.",
            ["mechanisms", "weak-topic"],
        ),
    ]
    for title, subject, content, summary, tags in notes:
        db.add(
            Note(
                user_id=user.id,
                title=title,
                subject=subject,
                content=content,
                summary=summary,
                tags=tags,
                bookmarked=subject == "Biology",
            )
        )

    moods = [(2, 5, 2, 4), (3, 4, 3, 4), (4, 3, 4, 3)]
    for offset, (stress, motivation, fatigue, confidence) in enumerate(moods):
        entry = MoodEntry(
            user_id=user.id,
            stress=stress,
            motivation=motivation,
            fatigue=fatigue,
            confidence=confidence,
            note="Auto-seeded adaptive baseline",
        )
        entry.created_at = now - timedelta(days=offset)
        entry.updated_at = entry.created_at
        db.add(entry)

    cards = [
        ("Economics", "Multiplier Effect", "What happens to aggregate output when fiscal spending rises?", "Output increases more than the initial spend because income recirculates.", "Think ripple effect.", 0.55),
        ("Chemistry", "SN1 vs SN2", "What condition favors SN1 over SN2?", "A stable carbocation, polar protic solvent, and tertiary substrate.", "1 = lone carbocation step.", 0.42),
        ("Biology", "ATP Yield", "Why does oxidative phosphorylation produce most ATP?", "Because the electron transport chain drives proton gradients powering ATP synthase.", "ATP comes from the gradient.", 0.66),
    ]
    for subject, topic, front, back, mnemonic, mastery in cards:
        db.add(
            Flashcard(
                user_id=user.id,
                subject=subject,
                topic=topic,
                front=front,
                back=back,
                mnemonic=mnemonic,
                mastery=mastery,
                recall_strength=mastery,
            )
        )

    db.add(
        AdaptiveState(
            user_id=user.id,
            subject="General",
            mastery_level=0.74,
            fatigue_level=0.33,
            confidence_level=0.78,
            learning_velocity=0.69,
            weak_topics=["Reaction mechanisms", "Long-form recall", "Late-night retention"],
            preferred_study_window="morning",
            payload={"burnout_risk": 0.24, "consistency": 0.91},
        )
    )

    db.add(
        AnalyticsSnapshot(
            user_id=user.id,
            period="weekly",
            accuracy=87,
            mastery_score=74,
            weekly_improvement=18,
            consistency_score=91,
            cognitive_engagement=79,
            payload={"seeded": True},
        )
    )

    db.add(
        FocusLog(
            user_id=user.id,
            uninterrupted_minutes=39,
            interruptions=1,
            idle_seconds=42,
            tab_switches=2,
            focus_quality_score=83,
            cognitive_engagement_score=80,
            payload={"seeded": True},
        )
    )

    db.add(
        FatigueLog(
            user_id=user.id,
            fatigue_score=44,
            burnout_risk=41,
            frustration_index=29,
            recommended_action="take_break",
            payload={"seeded": True},
        )
    )

    db.add(
        MasteryScore(
            user_id=user.id,
            subject="Mathematics",
            topic="Calculus",
            mastery_score=91,
            confidence_score=88,
            revision_priority=1,
            attempt_count=5,
            payload={"seeded": True},
        )
    )
    db.add(
        MasteryScore(
            user_id=user.id,
            subject="Physics",
            topic="Conceptual physics",
            mastery_score=68,
            confidence_score=64,
            revision_priority=4,
            attempt_count=4,
            payload={"seeded": True},
        )
    )
    db.add(
        MasteryScore(
            user_id=user.id,
            subject="Chemistry",
            topic="Organic Chemistry",
            mastery_score=82,
            confidence_score=79,
            revision_priority=2,
            attempt_count=6,
            payload={"seeded": True},
        )
    )

    db.add(
        PerformanceMetric(
            user_id=user.id,
            subject="Chemistry",
            topic="Organic Chemistry",
            accuracy=78,
            completion_rate=94,
            response_speed=17.6,
            confidence_trend=76,
            retry_frequency=0.22,
            payload={"seeded": True},
        )
    )

    db.add(
        Recommendation(
            user_id=user.id,
            category="analytics",
            recommended_topic="Organic Chemistry",
            reason="Accuracy dropped by 12% after longer sessions.",
            recommended_session_length=45,
            priority=1,
            payload={"seeded": True},
        )
    )

    db.add(
        StudyStreak(
            user_id=user.id,
            streak_type="daily",
            current_value=12,
            best_value=12,
            milestone_label="Momentum Builder",
            engagement_prediction=87,
            payload={"seeded": True},
        )
    )

    db.add(
        StudyPlan(
            user_id=user.id,
            exam_date=date.today() + timedelta(days=9),
            available_hours=3.5,
            weak_topics=["Reaction mechanisms", "Macro policy comparisons"],
            schedule=[
                {
                    "day": "Monday",
                    "focus": "Reaction mechanisms sprint",
                    "hours": 2,
                    "mode": "quiz + flashcards",
                },
                {
                    "day": "Tuesday",
                    "focus": "Macroeconomics review",
                    "hours": 1.5,
                    "mode": "smart notes + timed recall",
                },
            ],
            guidance={"burnout_guardrail": "Stop after two deep sessions and insert a 20-minute reset."},
        )
    )
