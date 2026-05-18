import uuid
import base64
import qrcode
import io
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("TRAINER", "Trainer"),
        ("TRAINEE", "Trainee"),
        ("CLIENT", "Client"),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="TRAINEE")
    phone_number = models.CharField(max_length=20, blank=True)
    employee_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    department = models.CharField(max_length=100, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    site_location = models.CharField(max_length=200, blank=True)
    managed_site = models.CharField(max_length=200, blank=True)
    date_joined_org = models.DateField(null=True, blank=True)
    site_assignment = models.ForeignKey(
        'SiteLocation', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_users'
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class SiteLocation(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField()
    city = models.CharField(max_length=100)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    client = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='managed_locations',
        limit_choices_to={'role': 'CLIENT'}
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Course(models.Model):
    title = models.CharField(max_length=300)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_courses',
        limit_choices_to={'role': 'TRAINER'}
    )
    category = models.CharField(max_length=100, blank=True)
    duration_hours = models.FloatField(default=1.0)
    thumbnail = models.ImageField(upload_to='courses/', null=True, blank=True)
    is_online = models.BooleanField(default=False)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Session(models.Model):
    SESSION_TYPES = (
        ("ONLINE", "Online"),
        ("OFFLINE", "Offline"),
    )
    STATUS_CHOICES = (
        ("SCHEDULED", "Scheduled"),
        ("ONGOING", "Ongoing"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="sessions")
    trainer = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name="trainer_sessions",
        limit_choices_to={'role': 'TRAINER'}
    )
    title = models.CharField(max_length=200, blank=True)
    session_type = models.CharField(max_length=10, choices=SESSION_TYPES, default="OFFLINE")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="SCHEDULED")
    scheduled_date = models.DateField(null=True, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    site_location = models.ForeignKey(
        SiteLocation, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='sessions'
    )
    meeting_link = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    trainees = models.ManyToManyField(User, related_name="enrolled_sessions", blank=True)
    max_trainees = models.IntegerField(default=30)
    qr_token = models.UUIDField(default=uuid.uuid4, unique=True)
    qr_code = models.ImageField(upload_to='qrcodes/', null=True, blank=True)
    enrollment_link = models.CharField(max_length=500, blank=True)
    is_completed = models.BooleanField(default=False)
    qr_image_base64 = models.TextField(blank=True)

    def _generate_qr_base64(self):
        try:
            from django.conf import settings
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            # Always encode the actual enrollment URL so scanning navigates directly
            qr_data = f"{frontend_url}/enroll/{self.qr_token}"
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=10,
                border=4,
            )
            qr.add_data(qr_data)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            return base64.b64encode(buffer.getvalue()).decode("utf-8")
        except Exception:
            return ""

    def save(self, *args, **kwargs):
        from django.conf import settings
        if self.status == "COMPLETED":
            self.is_completed = True
        if self.start_time and not self.scheduled_date:
            self.scheduled_date = self.start_time.date()
        # Always keep enrollment_link and qr_token in sync
        if not self.qr_token:
            self.qr_token = uuid.uuid4()
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        self.enrollment_link = f"{frontend_url}/enroll/{self.qr_token}"
        # Regenerate QR whenever enrollment_link changes or missing
        self.qr_image_base64 = self._generate_qr_base64()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title or self.course.title} - {self.start_time.strftime('%Y-%m-%d')}"


class Attendance(models.Model):
    STATUS_CHOICES = (
        ("PRESENT", "Present"),
        ("ABSENT", "Absent"),
        ("LATE", "Late"),
    )
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="attendances")
    trainee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="attendances"
    )
    ENROLLED_VIA_CHOICES = (
        ('QR', 'QR Scan'),
        ('LINK', 'Direct Link'),
        ('MANUAL', 'Manual'),
        ('SELF', 'Self'),
    )
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    join_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="ABSENT")
    enrolled_via = models.CharField(max_length=10, choices=ENROLLED_VIA_CHOICES, default='MANUAL')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ("session", "trainee")

    def __str__(self):
        return f"{self.trainee.username} - {self.status}"


class Quiz(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="quizzes", null=True, blank=True)
    title = models.CharField(max_length=300)
    questions = models.JSONField(default=list, blank=True)
    is_pre_assessment = models.BooleanField(default=False)
    passing_score = models.IntegerField(default=70)
    time_limit_minutes = models.IntegerField(default=30)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title


class QuizResult(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="results")
    trainee = models.ForeignKey(User, on_delete=models.CASCADE, related_name="quiz_results")
    session = models.ForeignKey(Session, on_delete=models.SET_NULL, null=True, blank=True)
    score = models.FloatField()
    total_score = models.FloatField()
    percentage = models.FloatField(default=0)
    passed = models.BooleanField(default=False)
    recommendations = models.TextField(blank=True, null=True)
    attempt_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_taken_minutes = models.IntegerField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.total_score and self.total_score > 0:
            self.percentage = round((self.score / self.total_score) * 100, 2)
            passing = self.quiz.passing_score if self.quiz else 70
            self.passed = self.percentage >= passing
        if not self.completed_at:
            self.completed_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.trainee.username} - {self.quiz.title} - {'Passed' if self.passed else 'Failed'}"


class Feedback(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="feedbacks")
    trainee = models.ForeignKey(User, on_delete=models.CASCADE, related_name="submitted_feedbacks")
    trainer_rating = models.IntegerField(default=5)
    content_rating = models.IntegerField(default=5)
    venue_rating = models.IntegerField(default=5)
    overall_rating = models.IntegerField(default=5)
    rating = models.IntegerField(default=5)
    comments = models.TextField(blank=True, null=True)
    is_mandatory = models.BooleanField(default=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)
    # Extended rating fields
    trainer_knowledge_rating = models.IntegerField(null=True, blank=True)
    trainer_communication_rating = models.IntegerField(null=True, blank=True)
    trainer_engagement_rating = models.IntegerField(null=True, blank=True)
    content_relevance_rating = models.IntegerField(null=True, blank=True)
    content_clarity_rating = models.IntegerField(null=True, blank=True)
    would_recommend = models.BooleanField(null=True, blank=True)
    best_part = models.TextField(blank=True, null=True)
    improvement_suggestion = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        self.rating = self.overall_rating
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Feedback for {self.session} by {self.trainee.username}"


class TrainerFeedback(models.Model):
    session = models.ForeignKey(Session, on_delete=models.SET_NULL, null=True, blank=True)
    trainer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_feedbacks')
    trainee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_feedbacks')
    discipline_score = models.IntegerField(default=8)
    aptitude_score = models.IntegerField(default=8)
    participation_score = models.IntegerField(default=8)
    overall_score = models.IntegerField(default=8)
    attendance_score = models.IntegerField(default=8)
    understanding_score = models.IntegerField(default=8)
    comments = models.TextField(blank=True)
    recommendations = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Eval for {self.trainee.username} by {self.trainer.username}"


class Certificate(models.Model):
    COMPLETION_TYPE_CHOICES = (
        ('OFFLINE', 'Offline Session'),
        ('ONLINE', 'Online Module'),
    )
    trainee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates')
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    issued_date = models.DateField(null=True, blank=True)
    certificate_number = models.CharField(max_length=100, unique=True)
    pdf_file = models.FileField(upload_to='certificates/', null=True, blank=True)
    is_valid = models.BooleanField(default=True)
    completion_type = models.CharField(
        max_length=20, choices=COMPLETION_TYPE_CHOICES, default='OFFLINE'
    )

    def __str__(self):
        return self.certificate_number


class TraineeSessionProgress(models.Model):
    PROGRESS_CHOICES = (
        ('NOT_STARTED', 'Not Started'),
        ('BEGIN', 'Begun'),
        ('MID', 'Mid-way'),
        ('COMPLETED', 'Completed'),
    )
    trainee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='session_progress',
        limit_choices_to={'role': 'TRAINEE'}
    )
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='trainee_progress')
    progress = models.CharField(max_length=15, choices=PROGRESS_CHOICES, default='NOT_STARTED')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('trainee', 'session')

    def __str__(self):
        return f"{self.trainee.username} - {self.session} - {self.progress}"


class QuestionBank(models.Model):
    QUESTION_TYPE_CHOICES = (
        ('MCQ', 'Multiple Choice'),
        ('TRUE_FALSE', 'True/False'),
        ('SHORT', 'Short Answer'),
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='question_bank')
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        limit_choices_to={'role': 'TRAINER'}
    )
    question_text = models.TextField()
    question_type = models.CharField(max_length=15, choices=QUESTION_TYPE_CHOICES, default='MCQ')
    options = models.JSONField(default=list, blank=True)  # list of option strings
    correct_answer = models.CharField(max_length=500)
    explanation = models.TextField(blank=True)
    difficulty = models.CharField(
        max_length=10,
        choices=[('EASY', 'Easy'), ('MEDIUM', 'Medium'), ('HARD', 'Hard')],
        default='MEDIUM'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.course.title}] {self.question_text[:60]}"
