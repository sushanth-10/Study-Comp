"""SQLAlchemy models for adaptive learning telemetry."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from study_backend.database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), default="")
    avatar_url: Mapped[str] = mapped_column(String(500), default="")
    provider: Mapped[str] = mapped_column(String(50), default="local")
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Calcutta")
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False)

    sessions: Mapped[list["StudySession"]] = relationship(back_populates="user")
    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship(back_populates="user")
    flashcards: Mapped[list["Flashcard"]] = relationship(back_populates="user")
    flashcard_reviews: Mapped[list["FlashcardReview"]] = relationship(back_populates="user")
    moods: Mapped[list["MoodEntry"]] = relationship(back_populates="user")
    notes: Mapped[list["Note"]] = relationship(back_populates="user")
    plans: Mapped[list["StudyPlan"]] = relationship(back_populates="user")
    states: Mapped[list["AdaptiveState"]] = relationship(back_populates="user")
    analytics_snapshots: Mapped[list["AnalyticsSnapshot"]] = relationship(back_populates="user")
    focus_logs: Mapped[list["FocusLog"]] = relationship(back_populates="user")
    fatigue_logs: Mapped[list["FatigueLog"]] = relationship(back_populates="user")
    mastery_scores: Mapped[list["MasteryScore"]] = relationship(back_populates="user")
    performance_metrics: Mapped[list["PerformanceMetric"]] = relationship(back_populates="user")
    recommendations: Mapped[list["Recommendation"]] = relationship(back_populates="user")
    streaks: Mapped[list["StudyStreak"]] = relationship(back_populates="user")


class StudySession(TimestampMixin, Base):
    __tablename__ = "study_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    subject: Mapped[str] = mapped_column(String(120))
    topic: Mapped[str] = mapped_column(String(160))
    duration_minutes: Mapped[int] = mapped_column(Integer, default=25)
    focus_score: Mapped[float] = mapped_column(Float, default=75)
    productivity_score: Mapped[float] = mapped_column(Float, default=70)
    fatigue_score: Mapped[float] = mapped_column(Float, default=30)
    interruptions: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=True)
    session_type: Mapped[str] = mapped_column(String(40), default="study")
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, default=dict)

    user: Mapped["User"] = relationship(back_populates="sessions")


class QuizAttempt(TimestampMixin, Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    topic: Mapped[str] = mapped_column(String(160))
    subject: Mapped[str] = mapped_column(String(120), default="General")
    difficulty: Mapped[str] = mapped_column(String(32), default="moderate")
    score: Mapped[float] = mapped_column(Float, default=0)
    total_questions: Mapped[int] = mapped_column(Integer, default=10)
    confidence_avg: Mapped[float] = mapped_column(Float, default=0.7)
    response_time_avg: Mapped[float] = mapped_column(Float, default=18.0)
    fatigue_indicator: Mapped[float] = mapped_column(Float, default=0.25)
    weak_areas: Mapped[list] = mapped_column(JSON, default=list)
    result_payload: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped["User"] = relationship(back_populates="quiz_attempts")


class Flashcard(TimestampMixin, Base):
    __tablename__ = "flashcards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    subject: Mapped[str] = mapped_column(String(120))
    topic: Mapped[str] = mapped_column(String(160))
    front: Mapped[str] = mapped_column(Text)
    back: Mapped[str] = mapped_column(Text)
    mnemonic: Mapped[str] = mapped_column(Text, default="")
    difficulty: Mapped[float] = mapped_column(Float, default=0.4)
    mastery: Mapped[float] = mapped_column(Float, default=0.5)
    next_review_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    interval_days: Mapped[int] = mapped_column(Integer, default=1)
    recall_strength: Mapped[float] = mapped_column(Float, default=0.5)

    user: Mapped["User"] = relationship(back_populates="flashcards")


class FlashcardReview(TimestampMixin, Base):
    __tablename__ = "flashcard_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    flashcard_id: Mapped[int] = mapped_column(ForeignKey("flashcards.id"))
    rating: Mapped[int] = mapped_column(Integer, default=3)
    response_ms: Mapped[int] = mapped_column(Integer, default=5000)
    was_correct: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship(back_populates="flashcard_reviews")


class MoodEntry(TimestampMixin, Base):
    __tablename__ = "moods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    stress: Mapped[int] = mapped_column(Integer, default=3)
    motivation: Mapped[int] = mapped_column(Integer, default=4)
    fatigue: Mapped[int] = mapped_column(Integer, default=3)
    confidence: Mapped[int] = mapped_column(Integer, default=4)
    note: Mapped[str] = mapped_column(Text, default="")

    user: Mapped["User"] = relationship(back_populates="moods")


class Note(TimestampMixin, Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(160))
    subject: Mapped[str] = mapped_column(String(120), default="General")
    content: Mapped[str] = mapped_column(Text)
    summary: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[list] = mapped_column(JSON, default=list)
    bookmarked: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="notes")


class StudyPlan(TimestampMixin, Base):
    __tablename__ = "planners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    exam_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    available_hours: Mapped[float] = mapped_column(Float, default=2.0)
    weak_topics: Mapped[list] = mapped_column(JSON, default=list)
    schedule: Mapped[list] = mapped_column(JSON, default=list)
    guidance: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped["User"] = relationship(back_populates="plans")


class AdaptiveState(TimestampMixin, Base):
    __tablename__ = "adaptive_states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    subject: Mapped[str] = mapped_column(String(120), default="General")
    mastery_level: Mapped[float] = mapped_column(Float, default=0.5)
    fatigue_level: Mapped[float] = mapped_column(Float, default=0.3)
    confidence_level: Mapped[float] = mapped_column(Float, default=0.6)
    learning_velocity: Mapped[float] = mapped_column(Float, default=0.5)
    weak_topics: Mapped[list] = mapped_column(JSON, default=list)
    preferred_study_window: Mapped[str] = mapped_column(String(32), default="morning")
    payload: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped["User"] = relationship(back_populates="states")


class AnalyticsSnapshot(TimestampMixin, Base):
    __tablename__ = "analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    period: Mapped[str] = mapped_column(String(24), default="weekly")
    accuracy: Mapped[float] = mapped_column(Float, default=0)
    mastery_score: Mapped[float] = mapped_column(Float, default=0)
    weekly_improvement: Mapped[float] = mapped_column(Float, default=0)
    consistency_score: Mapped[float] = mapped_column(Float, default=0)
    cognitive_engagement: Mapped[float] = mapped_column(Float, default=0)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped["User"] = relationship(back_populates="analytics_snapshots")


class FocusLog(TimestampMixin, Base):
    __tablename__ = "focus_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    session_id: Mapped[int | None] = mapped_column(ForeignKey("study_sessions.id"), nullable=True)
    uninterrupted_minutes: Mapped[float] = mapped_column(Float, default=25)
    interruptions: Mapped[int] = mapped_column(Integer, default=0)
    idle_seconds: Mapped[int] = mapped_column(Integer, default=0)
    tab_switches: Mapped[int] = mapped_column(Integer, default=0)
    focus_quality_score: Mapped[float] = mapped_column(Float, default=75)
    cognitive_engagement_score: Mapped[float] = mapped_column(Float, default=72)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped["User"] = relationship(back_populates="focus_logs")


class FatigueLog(TimestampMixin, Base):
    __tablename__ = "fatigue_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    session_id: Mapped[int | None] = mapped_column(ForeignKey("study_sessions.id"), nullable=True)
    fatigue_score: Mapped[float] = mapped_column(Float, default=30)
    burnout_risk: Mapped[float] = mapped_column(Float, default=20)
    frustration_index: Mapped[float] = mapped_column(Float, default=18)
    recommended_action: Mapped[str] = mapped_column(String(64), default="continue")
    payload: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped["User"] = relationship(back_populates="fatigue_logs")


class MasteryScore(TimestampMixin, Base):
    __tablename__ = "mastery_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    subject: Mapped[str] = mapped_column(String(120))
    topic: Mapped[str] = mapped_column(String(160))
    mastery_score: Mapped[float] = mapped_column(Float, default=0)
    confidence_score: Mapped[float] = mapped_column(Float, default=0)
    revision_priority: Mapped[int] = mapped_column(Integer, default=3)
    attempt_count: Mapped[int] = mapped_column(Integer, default=0)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped["User"] = relationship(back_populates="mastery_scores")


class PerformanceMetric(TimestampMixin, Base):
    __tablename__ = "performance_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    subject: Mapped[str] = mapped_column(String(120), default="General")
    topic: Mapped[str] = mapped_column(String(160), default="General")
    accuracy: Mapped[float] = mapped_column(Float, default=0)
    completion_rate: Mapped[float] = mapped_column(Float, default=0)
    response_speed: Mapped[float] = mapped_column(Float, default=0)
    confidence_trend: Mapped[float] = mapped_column(Float, default=0)
    retry_frequency: Mapped[float] = mapped_column(Float, default=0)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped["User"] = relationship(back_populates="performance_metrics")


class Recommendation(TimestampMixin, Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    category: Mapped[str] = mapped_column(String(64), default="study")
    recommended_topic: Mapped[str] = mapped_column(String(160), default="")
    reason: Mapped[str] = mapped_column(Text, default="")
    recommended_session_length: Mapped[int] = mapped_column(Integer, default=30)
    priority: Mapped[int] = mapped_column(Integer, default=2)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped["User"] = relationship(back_populates="recommendations")


class StudyStreak(TimestampMixin, Base):
    __tablename__ = "streaks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    streak_type: Mapped[str] = mapped_column(String(24), default="daily")
    current_value: Mapped[int] = mapped_column(Integer, default=0)
    best_value: Mapped[int] = mapped_column(Integer, default=0)
    milestone_label: Mapped[str] = mapped_column(String(64), default="")
    engagement_prediction: Mapped[float] = mapped_column(Float, default=0)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped["User"] = relationship(back_populates="streaks")
