import os
import django
from datetime import timedelta
from django.utils import timezone
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import User, Course, Session, Attendance, Quiz, Feedback
from django.contrib.auth.hashers import make_password

print("Starting to seed database with mock data...")

# Create Admin if not exists
if not User.objects.filter(username="admin").exists():
    User.objects.create_superuser("admin", "admin@example.com", "admin")
    print("Created superuser 'admin'")

# Create Trainer
trainer, _ = User.objects.get_or_create(
    username="trainer1",
    defaults={
        "email": "trainer1@example.com",
        "role": "TRAINER",
        "first_name": "Alan",
        "last_name": "Turing"
    }
)
if _: 
    trainer.set_password("password123")
    trainer.save()
    print("Created Trainer 'trainer1'")

# Create Trainees
trainees = []
for i in range(1, 11):
    t, created = User.objects.get_or_create(
        username=f"trainee{i}",
        defaults={
            "email": f"trainee{i}@example.com",
            "role": "TRAINEE",
            "first_name": f"Student{i}",
            "last_name": "Trainee"
        }
    )
    if created:
        t.set_password("password123")
        t.save()
    trainees.append(t)
if created:
    print(f"Created {len(trainees)} Trainees (e.g. trainee1)")

# Create Courses
courses_data = [
    {"title": "Phishing Defense 101", "desc": "Learn to identify and avoid phishing attacks."},
    {"title": "Advanced Threat Protection", "desc": "Deep dive into secure network policies."},
    {"title": "Data Privacy Basics", "desc": "Handling PII and sensitive company data."}
]
db_courses = []
for cdata in courses_data:
    course, created = Course.objects.get_or_create(
        title=cdata["title"],
        defaults={"description": cdata["desc"]}
    )
    db_courses.append(course)
    if created:
        print(f"Created Course '{course.title}'")

# Create Sessions
now = timezone.now()
session_titles = ["March Cohort", "April Deep Dive", "Orientation Session"]

db_sessions = []
for i, course in enumerate(db_courses):
    session, created = Session.objects.get_or_create(
        title=session_titles[i],
        course=course,
        trainer=trainer,
        defaults={
            "session_type": "VIRTUAL",
            "start_time": now + timedelta(days=i*2 + 1),
            "end_time": now + timedelta(days=i*2 + 1, hours=2),
            "meeting_link": "https://zoom.us/j/123456789",
            "location": "Online"
        }
    )
    if created:
        print(f"Created Session '{session.title}'")
    db_sessions.append(session)

# Enroll Trainees in Sessions and mark attendance
for session in db_sessions:
    session.trainees.add(*trainees) # Enroll all
    
    # Randomly mark attendance (status=True = Present)
    for trainee in trainees:
        if random.choice([True, False, True]): # 66% chance to attend
            Attendance.objects.get_or_create(
                session=session, trainee=trainee,
                defaults={"status": True}
            )

# Mark the first session as completed for testing
if db_sessions:
    first_session = db_sessions[0]
    first_session.is_completed = True
    first_session.save()
    print(f"Marked session '{first_session.title}' as completed")

# Create a sample Quiz
quiz, created = Quiz.objects.get_or_create(
    title="Phishing Basics Quiz",
    course=db_courses[0],
    defaults={
        "questions": [
            {
                "id": "q1",
                "text": "What is phishing?",
                "type": "multiple-choice",
                "options": ["A fish", "A social engineering attack", "A firewall"],
                "correctAnswer": "A social engineering attack"
            },
            {
                "id": "q2",
                "text": "Should you click unknown links?",
                "type": "true-false",
                "options": ["True", "False"],
                "correctAnswer": "False"
            }
        ]
    }
)
if created:
    print(f"Created Quiz '{quiz.title}'")

# Create sample feedback
for trainee in trainees[:3]:
    Feedback.objects.get_or_create(
        session=db_sessions[0],
        trainee=trainee,
        defaults={
            "rating": random.randint(4, 5),
            "comments": "Great session, learned a lot!"
        }
    )

print("Database successfully seeded!")
