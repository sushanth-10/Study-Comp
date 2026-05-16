"""Pydantic schemas."""
from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


class DashboardOverview(BaseModel):
    studyHours: float
    weeklyStreak: int
    focusScore: int
    learningVelocity: int
    masteryLevel: int
    topicCompletion: int
    fatigueScore: int
    weeklyConsistency: int


class ActivityItem(BaseModel):
    title: str
    subject: str
    timestamp: datetime
    durationMinutes: int = 0
    completion: int = 0
    trend: str = "stable"


class InsightItem(BaseModel):
    title: str
    message: str
    metric: str
    severity: str = "info"


class QuizGenerateRequest(BaseModel):
    topic: str = Field(min_length=2)
    difficulty: str = "moderate"
    count: int = Field(default=15, ge=10, le=30)
    subject: str = "General"
    weak_topics: list[str] = Field(default_factory=list)


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_index: int
    explanation: str
    confidence: float = 0.7


class AnalyticsUpdateRequest(BaseModel):
    eventType: str
    subject: str = "General"
    topic: str = "General"
    durationMinutes: int = 0
    focusScore: float = 75
    productivityScore: float = 75
    fatigueScore: float = 25
    interruptions: int = 0
    quizScore: float | None = None
    totalQuestions: int | None = None
    confidenceAvg: float | None = None
    responseTimeAvg: float | None = None
    completionRate: float | None = None
    retryFrequency: float | None = None
    idleSeconds: int = 0
    tabSwitches: int = 0
    unansweredCount: int = 0
    timestamp: datetime | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AnalyticsOverviewResponse(BaseModel):
    accuracy: int
    masteryScore: int
    weeklyImprovement: int
    consistencyScore: int
    learningVelocity: int
    focusQuality: int
    cognitiveEngagement: int
    charts: dict[str, list[dict[str, Any]]]


class FatigueResponse(BaseModel):
    fatigueLevel: str
    burnoutRisk: int
    recommendedAction: str
    frustrationIndex: int
    charts: dict[str, list[dict[str, Any]]]


class StudyPlanRequest(BaseModel):
    exam_date: date | None = None
    available_hours: float = Field(default=2.0, gt=0, le=16)
    weak_topics: list[str] = Field(default_factory=list)
    subjects: list[str] = Field(default_factory=list)


class FlashcardGenerateRequest(BaseModel):
    topic: str = Field(min_length=2)
    subject: str = "General"
    notes: str = ""
    count: int = Field(default=8, ge=4, le=20)


class MoodUpdateRequest(BaseModel):
    stress: int = Field(ge=1, le=5)
    motivation: int = Field(ge=1, le=5)
    fatigue: int = Field(ge=1, le=5)
    confidence: int = Field(ge=1, le=5)
    note: str = ""


class SmartNotesRequest(BaseModel):
    title: str = Field(min_length=2)
    subject: str = "General"
    content: str = Field(min_length=20)


class ConceptMapRequest(BaseModel):
    topic: str = Field(min_length=2)
    notes: str = ""
