"""Adaptive quiz, flashcard, planner, and notes engines."""
from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from quiz_service import generate_quiz as legacy_generate_quiz
from study_backend.models import AdaptiveState, Flashcard, Note, QuizAttempt, StudyPlan, User
from study_backend.schemas import FlashcardGenerateRequest, QuizGenerateRequest, SmartNotesRequest, StudyPlanRequest
from study_backend.services.openrouter import structured_completion


def generate_adaptive_quiz(db: Session, user: User, request: QuizGenerateRequest) -> dict:
    state = (
        db.query(AdaptiveState)
        .filter(AdaptiveState.user_id == user.id)
        .order_by(AdaptiveState.updated_at.desc())
        .first()
    )
    difficulty = request.difficulty
    if state and state.mastery_level > 0.8 and difficulty == "moderate":
        difficulty = "hard"
    elif state and state.fatigue_level > 0.55 and difficulty == "hard":
        difficulty = "moderate"

    quiz = legacy_generate_quiz(request.topic, difficulty, request.count, getattr(request, 'context', ''))
    for question in quiz["questions"]:
        question["confidence"] = round((state.confidence_level if state else 0.72), 2)

    weak_topics = request.weak_topics or (state.weak_topics if state else [])
    quiz["recommended_next"] = {
        "weakTopicQuiz": weak_topics[:3],
        "masteryProgression": min(100, round((state.mastery_level if state else 0.7) * 100 + 4)),
        "fatigueAdjustedDifficulty": difficulty,
    }
    return quiz


def record_quiz_outcome(
    db: Session,
    user: User,
    topic: str,
    subject: str,
    difficulty: str,
    score: float,
    total: int,
    confidence: float,
    response_time_avg: float,
    metadata: dict,
) -> QuizAttempt:
    quiz = QuizAttempt(
        user_id=user.id,
        topic=topic,
        subject=subject,
        difficulty=difficulty,
        score=score,
        total_questions=total,
        confidence_avg=confidence,
        response_time_avg=response_time_avg,
        fatigue_indicator=max(0.1, 1 - confidence),
        weak_areas=metadata.get("weak_topics", []),
        result_payload=metadata,
    )
    db.add(quiz)
    return quiz


def generate_flashcards(db: Session, user: User, request: FlashcardGenerateRequest) -> dict:
    payload = {
        "topic": request.topic,
        "subject": request.subject,
        "notes": request.notes,
        "count": request.count,
    }
    ai_data = structured_completion(
        "flashcards",
        "Generate concise adaptive flashcards with mnemonics.",
        '{"cards":[{"front":"string","back":"string","mnemonic":"string"}]}',
        payload,
    )

    cards = []
    for item in ai_data.get("cards", [])[: request.count]:
        card = Flashcard(
            user_id=user.id,
            subject=request.subject,
            topic=request.topic,
            front=item["front"],
            back=item["back"],
            mnemonic=item.get("mnemonic", ""),
            mastery=0.45,
            difficulty=0.5,
            recall_strength=0.45,
            next_review_on=datetime.utcnow() + timedelta(days=1),
            interval_days=1,
        )
        db.add(card)
        cards.append(item)
    return {"topic": request.topic, "subject": request.subject, "cards": cards}


def generate_plan(db: Session, user: User, request: StudyPlanRequest) -> dict:
    payload = request.model_dump()
    ai_data = structured_completion(
        "plan",
        "Create an adaptive study plan that prioritizes weak topics, balances workload, and avoids burnout.",
        '{"schedule":[{"day":"string","focus":"string","hours":0,"mode":"string"}],"guidance":{"burnout_guardrail":"string","priority_rule":"string"}}',
        payload,
    )
    plan = StudyPlan(
        user_id=user.id,
        exam_date=request.exam_date,
        available_hours=request.available_hours,
        weak_topics=request.weak_topics,
        schedule=ai_data.get("schedule", []),
        guidance=ai_data.get("guidance", {}),
    )
    db.add(plan)
    return ai_data


def smart_notes(db: Session, user: User, request: SmartNotesRequest) -> dict:
    ai_data = structured_completion(
        "notes",
        "Summarize these notes into a revision-friendly packet.",
        '{"summary":"string","key_points":["string"],"revision_prompts":["string"]}',
        request.model_dump(),
    )
    note = Note(
        user_id=user.id,
        title=request.title,
        subject=request.subject,
        content=request.content,
        summary=ai_data.get("summary", ""),
        tags=ai_data.get("key_points", [])[:4],
    )
    db.add(note)
    return {"note": ai_data, "saved": True}


def concept_map(topic: str, notes: str) -> dict:
    prompt = f"""Generate a high-level hierarchical study roadmap for: "{topic}".

Rules:
- Output a nested JSON tree.
- Include 10-15 essential nodes only.
- 5 levels: 1:Fundamentals (Root), 2:Core, 3:Intermediate, 4:Advanced, 5:Practice.
- Keep labels very short (1-3 words).
- Focus only on {topic} subject matter.
- Return ONLY valid JSON.

Schema:
{{
  "id": "root",
  "label": "string",
  "type": "level1",
  "description": "short string",
  "children": [
    {{ "id": "s1", "label": "string", "type": "level2", "children": [] }}
  ]
}}
"""
    return structured_completion(
        "concept_map",
        prompt,
        '{"id":"root","label":"Topic","type":"level1","children":[]}',
        {"topic": topic, "notes": notes},
    )


