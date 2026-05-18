from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, SiteLocationViewSet, CourseViewSet, SessionViewSet,
    AttendanceViewSet, QuizViewSet, QuizResultViewSet, FeedbackViewSet,
    TrainerFeedbackViewSet, CertificateViewSet,
    # Auth
    current_user_profile,
    # QR enrollment
    session_by_qr_token, enroll_by_qr_token,
    # Admin (legacy user_id based)
    admin_dashboard_data, admin_analytics, admin_compliance,
    admin_gap_analysis, admin_attendance_audit,
    # Admin self-auth
    admin_analytics_self, admin_feedback_summary,
    # Trainer (legacy user_id based)
    trainer_dashboard_data, trainer_sessions, trainer_trainees, leaderboard,
    trainer_trainee_performance,
    # Trainer self-auth
    trainer_sessions_self, trainer_sessions_full, trainer_session_trainees,
    trainer_feedback_received_self, trainer_leaderboard,
    # Trainee (legacy user_id based)
    trainee_dashboard_data, trainee_upcoming_sessions, trainee_available_sessions,
    trainee_completed_sessions, trainee_report_card, trainee_attendance_data,
    trainee_certificates, enroll_session, unenroll_session,
    # Trainee self-auth
    trainee_certificates_self, trainee_upcoming_sessions_self,
    trainee_submit_feedback, trainee_session_progress,
    # Trainee leaderboard
    trainee_leaderboard,
    # Client (legacy)
    client_dashboard_data, client_compliance,
    # Client self-auth
    client_dashboard_self, client_compliance_self,
    # Question Bank
    question_bank_list, question_bank_detail, session_quiz_questions,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'sites', SiteLocationViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'sessions', SessionViewSet)
router.register(r'attendances', AttendanceViewSet)
router.register(r'quizzes', QuizViewSet)
router.register(r'quiz-results', QuizResultViewSet)
router.register(r'feedbacks', FeedbackViewSet)
router.register(r'trainer-feedbacks', TrainerFeedbackViewSet)
router.register(r'certificates', CertificateViewSet)

urlpatterns = [
    # Auth
    path('me/', current_user_profile, name='me'),

    # QR Enrollment (public)
    path('sessions/by-qr/<uuid:qr_token>/', session_by_qr_token, name='session-by-qr'),
    path('enroll/qr/<uuid:qr_token>/', enroll_by_qr_token, name='enroll-by-qr'),
    # Legacy QR paths
    path('enroll/<uuid:qr_token>/', session_by_qr_token, name='session-by-qr-legacy'),
    path('enroll/<uuid:qr_token>/confirm/', enroll_by_qr_token, name='enroll-by-qr-legacy'),

    # ── Admin self-auth (no user_id) ──
    path('admin/analytics/', admin_analytics_self, name='admin-analytics-self'),
    path('admin/feedback-summary/', admin_feedback_summary, name='admin-feedback-summary'),
    # Admin legacy (user_id based)
    path('admin-dashboard/', admin_dashboard_data, name='admin-dashboard'),
    path('admin/compliance/', admin_compliance, name='admin-compliance'),
    path('admin/gap-analysis/', admin_gap_analysis, name='admin-gap-analysis'),
    path('admin/attendance-audit/', admin_attendance_audit, name='admin-attendance-audit'),

    # ── Trainer self-auth (no user_id) ──
    path('trainer/sessions/', trainer_sessions_self, name='trainer-sessions-self'),
    path('trainer/sessions/full/', trainer_sessions_full, name='trainer-sessions-full'),
    path('trainer/sessions/<int:session_id>/trainees/', trainer_session_trainees, name='trainer-session-trainees'),
    path('trainer/feedback-received/', trainer_feedback_received_self, name='trainer-feedback-received-self'),
    path('trainer/leaderboard/', trainer_leaderboard, name='trainer-leaderboard'),
    # Trainer legacy
    path('trainer/<int:user_id>/dashboard/', trainer_dashboard_data, name='trainer-dashboard'),
    path('trainer/<int:user_id>/sessions/', trainer_sessions, name='trainer-sessions-legacy'),
    path('trainer/<int:user_id>/trainees/', trainer_trainees, name='trainer-trainees'),
    path('trainer/<int:user_id>/trainees/performance/', trainer_trainee_performance, name='trainer-trainee-performance'),
    path('leaderboard/', leaderboard, name='leaderboard'),
    # Trainee leaderboard (kept for compatibility)
    path('trainee/leaderboard/', trainee_leaderboard, name='trainee-leaderboard'),

    # ── Trainee self-auth (no user_id) ──
    path('trainee/upcoming/', trainee_upcoming_sessions_self, name='trainee-upcoming-self'),
    path('trainee/certificates/', trainee_certificates_self, name='trainee-certificates-self'),
    path('trainee/sessions/<int:session_id>/progress/', trainee_session_progress, name='trainee-session-progress'),
    path('trainee/sessions/<int:session_id>/feedback/', trainee_submit_feedback, name='trainee-submit-feedback'),
    # Trainee legacy
    path('trainee/<int:user_id>/dashboard/', trainee_dashboard_data, name='trainee-dashboard'),
    path('trainee/<int:user_id>/upcoming/', trainee_upcoming_sessions, name='trainee-upcoming'),
    path('trainee/<int:user_id>/available-sessions/', trainee_available_sessions, name='trainee-available'),
    path('trainee/<int:user_id>/completed/', trainee_completed_sessions, name='trainee-completed'),
    path('trainee/<int:user_id>/report-card/', trainee_report_card, name='trainee-report-card'),
    path('trainee/<int:user_id>/attendance/', trainee_attendance_data, name='trainee-attendance'),
    path('trainee/<int:user_id>/certificates/', trainee_certificates, name='trainee-certificates'),
    path('trainee/<int:user_id>/enroll/<int:session_id>/', enroll_session, name='enroll-session'),
    path('trainee/<int:user_id>/unenroll/<int:session_id>/', unenroll_session, name='unenroll-session'),

    # ── Client self-auth (no user_id) ──
    path('client/dashboard/', client_dashboard_self, name='client-dashboard-self'),
    path('client/compliance/', client_compliance_self, name='client-compliance-self'),
    # Client legacy
    path('client/<int:client_id>/dashboard/', client_dashboard_data, name='client-dashboard-legacy'),
    path('client/<int:client_id>/compliance/', client_compliance, name='client-compliance-legacy'),

    # ── Question Bank ──
    path('question-bank/', question_bank_list, name='question-bank-list'),
    path('question-bank/<int:pk>/', question_bank_detail, name='question-bank-detail'),
    path('sessions/<int:session_id>/quiz/', session_quiz_questions, name='session-quiz-questions'),

    path('', include(router.urls)),
]
