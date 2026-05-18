from django.contrib.auth import get_user_model
CustomUser = get_user_model()
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from api.models import Session, Attendance, Course
from datetime import datetime, timedelta, timezone
trainee = CustomUser.objects.filter(username='trainee1').first()
trainer = CustomUser.objects.filter(role='TRAINER').first()
course, _ = Course.objects.get_or_create(title='Basic Cyber Security')
course.description = 'Intro to Security'
course.save()
past_session1 = Session.objects.create(title='Completed Security Basics', course=course, trainer=trainer, date=(datetime.now(timezone.utc) - timedelta(days=5)).date(), time='10:00:00', location='Room 101', type='IN_PERSON')
past_session1.trainees.add(trainee)
Attendance.objects.create(session=past_session1, trainee=trainee, status='PRESENT', check_in_time=(datetime.now(timezone.utc) - timedelta(days=5)).replace(hour=9, minute=55).time())
print('Added completed sessions for trainee1!')
