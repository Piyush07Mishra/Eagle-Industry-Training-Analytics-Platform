from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
import datetime, uuid

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with initial training data'

    def handle(self, *args, **options):
        from api.models import (
            SiteLocation, Course, Session, Attendance,
            Quiz, QuizResult, Feedback, TrainerFeedback, Certificate
        )
        self.stdout.write('Clearing existing data...')
        Certificate.objects.all().delete()
        TrainerFeedback.objects.all().delete()
        Feedback.objects.all().delete()
        QuizResult.objects.all().delete()
        Quiz.objects.all().delete()
        Attendance.objects.all().delete()
        Session.objects.all().delete()
        Course.objects.all().delete()
        SiteLocation.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        self.stdout.write('Creating site locations...')
        bibwewadi = SiteLocation.objects.create(
            name='VIT Bibwewadi', address='Bibwewadi, Pune', city='Pune',
            latitude=18.4612, longitude=73.8526)
        khondwa = SiteLocation.objects.create(
            name='VIT Khondwa', address='Khondwa, Pune', city='Pune',
            latitude=18.4434, longitude=73.8766)

        self.stdout.write('Creating admin...')
        admin = User.objects.create_user(
            username='admin01', password='Password@123', employee_id='admin01',
            first_name='Rajesh', last_name='Kumar', email='admin@vit.edu',
            role='ADMIN', department='Administration', is_staff=True)

        self.stdout.write('Creating clients...')
        client1 = User.objects.create_user(
            username='client01', password='Password@123', employee_id='client01',
            first_name='Priya', last_name='Sharma', email='priya@vit.edu',
            role='CLIENT', managed_site='VIT Bibwewadi', site_location='VIT Bibwewadi')
        client2 = User.objects.create_user(
            username='client02', password='Password@123', employee_id='client02',
            first_name='Amit', last_name='Desai', email='amit@vit.edu',
            role='CLIENT', managed_site='VIT Khondwa', site_location='VIT Khondwa')
        bibwewadi.client = client1; bibwewadi.save()
        khondwa.client = client2; khondwa.save()

        self.stdout.write('Creating trainers...')
        trainer_data = [
            ('trainer01','Suresh','Patil','suresh@vit.edu','Fire Safety Expert','VIT Bibwewadi'),
            ('trainer02','Meena','Joshi','meena@vit.edu','First Aid Specialist','VIT Khondwa'),
            ('trainer03','Vikas','Nair','vikas@vit.edu','Industrial Safety','VIT Bibwewadi'),
            ('trainer04','Anita','Kulkarni','anita@vit.edu','Emergency Response','VIT Khondwa'),
            ('trainer05','Deepak','Rane','deepak@vit.edu','Hazmat Handling','VIT Bibwewadi'),
        ]
        trainers = {}
        for eid, fn, ln, email, desig, site in trainer_data:
            t = User.objects.create_user(
                username=eid, password='Password@123', employee_id=eid,
                first_name=fn, last_name=ln, email=email,
                role='TRAINER', designation=desig, site_location=site)
            trainers[eid] = t

        self.stdout.write('Creating trainees...')
        trainee_data = [
            ('trainee01','Aakash','Singh','Production Dept','VIT Bibwewadi'),
            ('trainee02','Sneha','More','Quality Dept','VIT Bibwewadi'),
            ('trainee03','Rohit','Verma','Maintenance','VIT Khondwa'),
            ('trainee04','Pooja','Kulkarni','Safety Dept','VIT Khondwa'),
            ('trainee05','Karan','Mehta','Production Dept','VIT Bibwewadi'),
            ('trainee06','Divya','Pawar','HR Dept','VIT Bibwewadi'),
            ('trainee07','Nikhil','Deshmukh','Engineering','VIT Khondwa'),
            ('trainee08','Priyanka','Shinde','Logistics','VIT Khondwa'),
            ('trainee09','Tejas','Bhosale','Production Dept','VIT Bibwewadi'),
            ('trainee10','Rutuja','Jadhav','Quality Dept','VIT Bibwewadi'),
            ('trainee11','Sagar','Wagh','Maintenance','VIT Khondwa'),
            ('trainee12','Manasi','Gaikwad','Safety Dept','VIT Khondwa'),
            ('trainee13','Abhishek','Salve','Production Dept','VIT Bibwewadi'),
            ('trainee14','Shruti','Kamble','Engineering','VIT Bibwewadi'),
            ('trainee15','Omkar','Thorat','Logistics','VIT Khondwa'),
        ]
        trainees = {}
        for eid, fn, ln, dept, site in trainee_data:
            t = User.objects.create_user(
                username=eid, password='Password@123', employee_id=eid,
                first_name=fn, last_name=ln, email=f'{eid}@vit.edu',
                role='TRAINEE', department=dept, site_location=site)
            trainees[eid] = t

        self.stdout.write('Creating courses...')
        courses = {}
        course_data = [
            ('Fire Safety Fundamentals','Comprehensive fire safety training covering extinguisher use, evacuation procedures, and fire prevention.','Safety',4.0,False,trainers['trainer01']),
            ('First Aid & CPR Certification','Learn life-saving first aid techniques and CPR certification.','Health',6.0,False,trainers['trainer02']),
            ('Industrial Hazard Awareness','Identify and manage industrial hazards in the workplace.','Safety',3.0,False,trainers['trainer03']),
            ('Emergency Evacuation Drill','Practical emergency evacuation procedures and assembly point training.','Emergency',2.0,False,trainers['trainer04']),
            ('Online Safety Induction Module','Online safety induction for new employees covering basic safety protocols.','Safety',1.5,True,trainers['trainer05']),
            ('PPE Usage & Compliance','Proper use and maintenance of personal protective equipment.','Compliance',2.0,True,trainers['trainer01']),
        ]
        for title, desc, cat, dur, is_online, trainer in course_data:
            c = Course.objects.create(title=title, description=desc, category=cat,
                duration_hours=dur, is_online=is_online, created_by=trainer)
            courses[title] = c

        self.stdout.write('Creating sessions...')
        now = timezone.now()
        def dt(days_offset, hour=9):
            d = now + datetime.timedelta(days=days_offset)
            return d.replace(hour=hour, minute=0, second=0, microsecond=0)

        session_data = [
            (courses['Fire Safety Fundamentals'], trainers['trainer01'], bibwewadi, 'OFFLINE', 'COMPLETED', -14),
            (courses['First Aid & CPR Certification'], trainers['trainer02'], khondwa, 'OFFLINE', 'COMPLETED', -7),
            (courses['Industrial Hazard Awareness'], trainers['trainer03'], bibwewadi, 'OFFLINE', 'COMPLETED', -3),
            (courses['Emergency Evacuation Drill'], trainers['trainer04'], khondwa, 'OFFLINE', 'COMPLETED', -1),
            (courses['Online Safety Induction Module'], trainers['trainer05'], None, 'ONLINE', 'SCHEDULED', 1),
            (courses['PPE Usage & Compliance'], trainers['trainer01'], None, 'ONLINE', 'SCHEDULED', 3),
            (courses['Fire Safety Fundamentals'], trainers['trainer02'], khondwa, 'OFFLINE', 'SCHEDULED', 7),
            (courses['First Aid & CPR Certification'], trainers['trainer03'], bibwewadi, 'OFFLINE', 'SCHEDULED', 14),
        ]
        sessions = []
        for course, trainer, site, stype, status, days in session_data:
            s = Session.objects.create(
                course=course, trainer=trainer, title=course.title,
                session_type=stype, status=status,
                start_time=dt(days), end_time=dt(days, hour=12),
                site_location=site,
                meeting_link='https://meet.google.com/abc-defg-hij' if stype == 'ONLINE' else '',
                is_completed=(status == 'COMPLETED'),
                scheduled_date=dt(days).date())
            sessions.append(s)

        self.stdout.write('Enrolling trainees into completed sessions...')
        active_trainees = [trainees[f'trainee{str(i).zfill(2)}'] for i in range(1, 11)]
        completed_sessions = sessions[:4]
        for s in completed_sessions:
            for t in active_trainees:
                s.trainees.add(t)

        self.stdout.write('Creating attendance records...')
        import random
        random.seed(42)
        for s in completed_sessions:
            for i, t in enumerate(active_trainees):
                roll = random.random()
                if roll < 0.80:
                    att_status = 'PRESENT'
                    check_in = s.start_time + datetime.timedelta(minutes=random.randint(0, 5))
                    check_out = s.end_time - datetime.timedelta(minutes=random.randint(0, 10))
                elif roll < 0.90:
                    att_status = 'LATE'
                    check_in = s.start_time + datetime.timedelta(minutes=random.randint(15, 30))
                    check_out = s.end_time
                else:
                    att_status = 'ABSENT'
                    check_in = None
                    check_out = None
                Attendance.objects.create(
                    session=s, trainee=t, status=att_status,
                    check_in_time=check_in, check_out_time=check_out,
                    latitude=s.site_location.latitude if s.site_location else None,
                    longitude=s.site_location.longitude if s.site_location else None)

        self.stdout.write('Creating quizzes...')
        quiz_questions = [
            {"question": "What is the first step when you discover a fire?", "options": ["Attempt to extinguish", "Alert others and call fire department", "Run immediately", "Open windows"], "answer": "Alert others and call fire department", "marks": 1},
            {"question": "Which class of fire involves electrical equipment?", "options": ["Class A", "Class B", "Class C", "Class D"], "answer": "Class C", "marks": 1},
            {"question": "What does PASS stand for in fire extinguisher use?", "options": ["Pull, Aim, Squeeze, Sweep", "Push, Aim, Spray, Stop", "Pull, Attack, Spray, Secure", "Point, Aim, Squeeze, Spray"], "answer": "Pull, Aim, Squeeze, Sweep", "marks": 1},
            {"question": "How far should you stand from a fire when using an extinguisher?", "options": ["1-2 feet", "6-8 feet", "15-20 feet", "30 feet"], "answer": "6-8 feet", "marks": 1},
            {"question": "What is the evacuation assembly point?", "options": ["Nearest exit", "Parking lot", "Designated muster point", "Manager's office"], "answer": "Designated muster point", "marks": 1},
            {"question": "How often should fire drills be conducted?", "options": ["Monthly", "Quarterly", "Annually", "Every 2 years"], "answer": "Quarterly", "marks": 1},
            {"question": "What color is a CO2 fire extinguisher?", "options": ["Red", "Black", "Blue", "Green"], "answer": "Black", "marks": 1},
            {"question": "Which PPE is mandatory in a fire zone?", "options": ["Safety glasses only", "Full fire-resistant suit", "Hard hat only", "Gloves only"], "answer": "Full fire-resistant suit", "marks": 1},
            {"question": "What should you do if your clothes catch fire?", "options": ["Run for help", "Stop, Drop, and Roll", "Jump in water", "Fan the flames"], "answer": "Stop, Drop, and Roll", "marks": 1},
            {"question": "Fire triangle elements are heat, fuel, and:", "options": ["Water", "Oxygen", "Carbon dioxide", "Nitrogen"], "answer": "Oxygen", "marks": 1},
        ]
        quizzes = {}
        for course in courses.values():
            q = Quiz.objects.create(course=course, title=f"{course.title} - Assessment",
                questions=quiz_questions, passing_score=70, time_limit_minutes=30,
                created_by=course.created_by)
            quizzes[course.title] = q

        self.stdout.write('Creating quiz results...')
        random.seed(123)
        for s in completed_sessions:
            quiz = quizzes[s.course.title]
            for t in active_trainees:
                att = Attendance.objects.filter(session=s, trainee=t).first()
                if att and att.status in ('PRESENT', 'LATE'):
                    score = random.randint(6, 10)
                else:
                    score = random.randint(3, 7)
                pct = score * 10
                passed = pct >= 70
                try:
                    QuizResult.objects.create(
                        quiz=quiz, trainee=t, session=s,
                        score=score, total_score=10, percentage=pct,
                        passed=passed,
                        recommendations=None,
                        completed_at=s.end_time + datetime.timedelta(minutes=30))
                except Exception:
                    pass

        self.stdout.write('Creating feedback...')
        random.seed(456)
        for s in completed_sessions:
            for t in active_trainees:
                att = Attendance.objects.filter(session=s, trainee=t).first()
                if att and att.status in ('PRESENT', 'LATE'):
                    tr_r = random.randint(3, 5)
                    co_r = random.randint(3, 5)
                    ve_r = random.randint(3, 5)
                    ov_r = round((tr_r + co_r + ve_r) / 3)
                    Feedback.objects.create(
                        session=s, trainee=t,
                        trainer_rating=tr_r, content_rating=co_r,
                        venue_rating=ve_r, overall_rating=ov_r, rating=ov_r,
                        comments=f"Good session. Learned a lot about {s.course.title}.")

        self.stdout.write('Creating trainer feedback...')
        random.seed(789)
        for s in completed_sessions:
            for t in active_trainees:
                att = Attendance.objects.filter(session=s, trainee=t).first()
                if att and att.status in ('PRESENT', 'LATE'):
                    TrainerFeedback.objects.create(
                        session=s, trainer=s.trainer, trainee=t,
                        discipline_score=random.randint(7, 10),
                        aptitude_score=random.randint(6, 10),
                        participation_score=random.randint(7, 10),
                        overall_score=random.randint(7, 10),
                        attendance_score=random.randint(7, 10),
                        understanding_score=random.randint(6, 10),
                        comments=f"Trainee performed well in {s.course.title}.")

        self.stdout.write('Creating certificates...')
        for s in completed_sessions:
            for t in active_trainees:
                att = Attendance.objects.filter(session=s, trainee=t).first()
                result = QuizResult.objects.filter(quiz=quizzes[s.course.title], trainee=t).first()
                has_fb = Feedback.objects.filter(session=s, trainee=t).exists()
                if att and att.status in ('PRESENT', 'LATE') and result and result.passed and has_fb:
                    cert_num = f"CERT-2025-{t.employee_id}-{s.id}"
                    try:
                        Certificate.objects.create(
                            trainee=t, session=s, course=s.course,
                            certificate_number=cert_num, is_valid=True,
                            issued_date=s.start_time.date() + datetime.timedelta(days=1))
                    except Exception:
                        pass

        self.stdout.write(self.style.SUCCESS('\nSeeding complete!'))
        self.stdout.write(f'  Site locations: {SiteLocation.objects.count()}')
        self.stdout.write(f'  Users: {User.objects.count()} (admin={User.objects.filter(role="ADMIN").count()}, trainers={User.objects.filter(role="TRAINER").count()}, trainees={User.objects.filter(role="TRAINEE").count()}, clients={User.objects.filter(role="CLIENT").count()})')
        self.stdout.write(f'  Courses: {Course.objects.count()}')
        self.stdout.write(f'  Sessions: {Session.objects.count()}')
        self.stdout.write(f'  Attendance records: {Attendance.objects.count()}')
        self.stdout.write(f'  Quizzes: {Quiz.objects.count()}')
        self.stdout.write(f'  Quiz results: {QuizResult.objects.count()}')
        self.stdout.write(f'  Feedback: {Feedback.objects.count()}')
        self.stdout.write(f'  Certificates: {Certificate.objects.count()}')
