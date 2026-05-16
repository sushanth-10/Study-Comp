import os
import random
from datetime import datetime, timedelta

from study_backend.database import SessionLocal
from study_backend.models import (
    User,
    StudySession,
    QuizAttempt,
    FatigueLog,
    MasteryScore,
    PerformanceMetric,
    AnalyticsSnapshot
)
from study_backend.services.analytics import persist_analytics_artifacts

def seed_data():
    db = SessionLocal()
    
    # Get the first user
    user = db.query(User).first()
    if not user:
        print("No user found. Run the app and login once.")
        return

    print(f"Seeding data for user: {user.email}")
    
    # Clear old data for a fresh graph
    db.query(StudySession).filter_by(user_id=user.id).delete()
    db.query(QuizAttempt).filter_by(user_id=user.id).delete()
    db.query(FatigueLog).filter_by(user_id=user.id).delete()
    db.query(MasteryScore).filter_by(user_id=user.id).delete()
    db.query(PerformanceMetric).filter_by(user_id=user.id).delete()
    db.commit()

    topics = ["Keynesian Theory", "Neural Plasticity", "Organic Chemistry", "Microeconomics", "Data Structures"]
    
    now = datetime.utcnow()
    
    # Generate data for the last 14 days
    for day in range(14, -1, -1):
        current_date = now - timedelta(days=day)
        
        # Fatigue trend goes up and down over the weeks. Higher towards end of week.
        day_of_week = current_date.weekday()
        fatigue_base = 20 + (day_of_week * 10) + random.randint(-10, 10)
        fatigue_base = max(0, min(100, fatigue_base))
        
        # Accuracy generally improves over time
        accuracy_base = 40 + ((14 - day) * 3) + random.randint(-5, 10)
        accuracy_base = max(0, min(100, accuracy_base))
        
        topic = random.choice(topics)
        
        # 1. Study Session
        session = StudySession(
            user_id=user.id,
            subject="General",
            topic=topic,
            duration_minutes=random.randint(20, 60),
            focus_score=random.randint(60, 95),
            productivity_score=random.randint(60, 90),
            fatigue_score=fatigue_base,
            started_at=current_date - timedelta(minutes=45),
            ended_at=current_date,
            session_type="study",
            completed=True
        )
        db.add(session)
        db.flush()
        
        # 2. Fatigue Log associated with the session
        fatigue = FatigueLog(
            user_id=user.id,
            session_id=session.id,
            fatigue_score=fatigue_base,
            burnout_risk=fatigue_base * 0.8,
            frustration_index=random.randint(5, 30),
            created_at=current_date
        )
        db.add(fatigue)
        
        # 3. Quiz Attempt
        quiz = QuizAttempt(
            user_id=user.id,
            subject="General",
            topic=topic,
            score=accuracy_base,
            total_questions=10,
            confidence_avg=accuracy_base / 100.0,
            response_time_avg=random.uniform(10.0, 25.0),
            created_at=current_date
        )
        db.add(quiz)
        
        # 4. Performance Metric
        metric = PerformanceMetric(
            user_id=user.id,
            subject="General",
            topic=topic,
            accuracy=accuracy_base,
            completion_rate=random.randint(80, 100),
            created_at=current_date
        )
        db.add(metric)
        
        # 5. Mastery Score
        mastery = MasteryScore(
            user_id=user.id,
            subject="General",
            topic=topic,
            mastery_score=accuracy_base,
            confidence_score=accuracy_base - 5,
            attempt_count=1,
            created_at=current_date
        )
        db.add(mastery)

    db.commit()
    print("Seed data inserted successfully.")
    db.close()

if __name__ == "__main__":
    seed_data()
