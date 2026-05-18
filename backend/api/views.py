import uuid
import io
import os
from datetime import timedelta

from django.conf import settings
from django.db.models import Count, Avg, Q, F
from django.http import FileResponse, HttpResponse
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    User, SiteLocation, Course, Session, Attendance,
    Quiz, QuizResult, Feedback, TrainerFeedback, Certificate,
    TraineeSessionProgress, QuestionBank,
)
from .serializers import (
    UserSerializer, SiteLocationSerializer, CourseSerializer,
    SessionSerializer, AttendanceSerializer, QuizSerializer,
    QuizResultSerializer, FeedbackSerializer, TrainerFeedbackSerializer,
    CertificateSerializer, TraineeSessionProgressSerializer, QuestionBankSerializer,
)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Accept login via employee_id OR username.
    The frontend sends the employee_id value in the 'username' field —
    we resolve it to the actual Django username before calling super().
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['employee_id'] = user.employee_id or user.username
        token['name'] = f"{user.first_name} {user.last_name}".strip() or user.username
        return token

    def validate(self, attrs):
        # Try to find user by employee_id first; fall back to username lookup
        login_value = attrs.get('username', '')
        try:
            matched = User.objects.get(employee_id=login_value)
            # Replace the 'username' key with the actual Django username
            attrs = dict(attrs)
            attrs['username'] = matched.username
        except User.DoesNotExist:
            pass  # Not found by employee_id — try as-is (username login)
        except User.MultipleObjectsReturned:
            pass  # Ambiguous — let default auth handle/reject it

        data = super().validate(attrs)
        user = self.user
        data['role'] = user.role
        data['user_id'] = user.id
        data['employee_id'] = user.employee_id or user.username
        data['name'] = f"{user.first_name} {user.last_name}".strip() or user.username
        data['department'] = user.department
        data['site_location'] = user.site_location
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_profile(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'employee_id': user.employee_id or user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'name': f"{user.first_name} {user.last_name}".strip() or user.username,
        'role': user.role,
        'phone_number': user.phone_number,
        'department': user.department,
        'designation': user.designation,
        'site_location': user.site_location,
        'managed_site': user.managed_site,
    })


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class SiteLocationViewSet(viewsets.ModelViewSet):
    queryset = SiteLocation.objects.filter(is_active=True)
    serializer_class = SiteLocationSerializer


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.filter(is_active=True)
    serializer_class = CourseSerializer


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer

    def get_queryset(self):
        qs = Session.objects.all()
        s = self.request.query_params.get('status')
        if s:
            qs = qs.filter(status=s.upper())
        return qs

    @action(detail=True, methods=['get'], url_path='qr')
    def get_qr(self, request, pk=None):
        session = self.get_object()
        _ensure_qr_generated(session, request)
        qr_url = request.build_absolute_uri(session.qr_code.url) if session.qr_code else None
        return Response({
            'qr_image_url': qr_url,
            'enrollment_link': session.enrollment_link,
            'session_details': {
                'id': session.id,
                'title': session.title or session.course.title,
                'course': session.course.title,
                'date': session.start_time.strftime('%Y-%m-%d'),
                'time': session.start_time.strftime('%I:%M %p'),
                'trainer_id': session.trainer.employee_id if session.trainer else None,
                'location': session.site_location.name if session.site_location else session.location,
                'seats_taken': session.trainees.count(),
                'max_trainees': session.max_trainees,
            }
        })

    @action(detail=True, methods=['post'], url_path='generate-qr')
    def regenerate_qr(self, request, pk=None):
        session = self.get_object()
        session.qr_token = uuid.uuid4()
        session.save()
        _ensure_qr_generated(session, request)
        qr_url = request.build_absolute_uri(session.qr_code.url) if session.qr_code else None
        return Response({'qr_image_url': qr_url, 'enrollment_link': session.enrollment_link})

    @action(detail=False, methods=['get'], url_path='dashboard-metrics')
    def dashboard_metrics(self, request):
        total = Session.objects.count()
        trainees = User.objects.filter(role='TRAINEE').count()
        completed = Session.objects.filter(status='COMPLETED').count()
        rate = round((completed / total * 100)) if total > 0 else 0
        results = QuizResult.objects.all()
        avg = round(results.aggregate(Avg('percentage'))['percentage__avg'] or 0, 1)
        return Response({
            'activeTrainees': trainees,
            'trainingCompletion': rate,
            'averageScore': avg,
            'complianceRate': rate,
            'recentSessions': total
        })


def _ensure_qr_generated(session, request=None):
    try:
        import qrcode
        from django.core.files.base import ContentFile
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        enrollment_link = f"{frontend_url}/enroll/{session.qr_token}/"
        session.enrollment_link = enrollment_link
        if not session.qr_code:
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(enrollment_link)
            qr.make(fit=True)
            img = qr.make_image(fill_color='black', back_color='white')
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            session.qr_code.save(f"qrcodes/{session.qr_token}.png", ContentFile(buffer.read()), save=False)
        session.save(update_fields=['enrollment_link', 'qr_code'])
    except Exception:
        pass


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer


class QuizResultViewSet(viewsets.ModelViewSet):
    queryset = QuizResult.objects.all()
    serializer_class = QuizResultSerializer


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer


class TrainerFeedbackViewSet(viewsets.ModelViewSet):
    queryset = TrainerFeedback.objects.all()
    serializer_class = TrainerFeedbackSerializer


class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer

    @action(detail=True, methods=['get'], url_path='pdf')
    def download_pdf(self, request, pk=None):
        cert = self.get_object()
        pdf_bytes = _generate_certificate_pdf(cert)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{cert.certificate_number}.pdf"'
        return response


def _generate_certificate_pdf(cert):
    try:
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib import colors
        from reportlab.lib.units import cm, mm
        from reportlab.pdfgen import canvas as rl_canvas
        from reportlab.platypus import Paragraph
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.lib.enums import TA_CENTER

        # ── Data ────────────────────────────────────────────────────
        trainer_name = ''
        if cert.session and cert.session.trainer:
            t = cert.session.trainer
            trainer_name = f"{t.first_name} {t.last_name}".strip() or t.username

        if cert.session and cert.session.site_location:
            location = cert.session.site_location.name
        elif cert.session:
            location = cert.session.location or 'Online'
        else:
            location = 'Online'

        issued_dt  = cert.issued_date or timezone.now().date()
        issued     = issued_dt.strftime('%B %d, %Y') if hasattr(issued_dt, 'strftime') else str(issued_dt)
        expiry_dt  = issued_dt + timedelta(days=365) if issued_dt else None
        expiry     = expiry_dt.strftime('%B %d, %Y') if expiry_dt and hasattr(expiry_dt, 'strftime') else ''
        trainee_name = f"{cert.trainee.first_name} {cert.trainee.last_name}".strip() or cert.trainee.username
        course_title = cert.course.title if cert.course else 'Training Course'

        # ── Canvas setup (landscape A4) ─────────────────────────────
        buffer  = io.BytesIO()
        W, H    = landscape(A4)          # 841.9 x 595.3 pt
        c       = rl_canvas.Canvas(buffer, pagesize=landscape(A4))

        # Colour palette
        NAVY    = colors.HexColor('#0f2044')
        BLUE    = colors.HexColor('#1a56db')
        GOLD    = colors.HexColor('#d4af37')
        LGRAY   = colors.HexColor('#f1f5f9')
        MGRAY   = colors.HexColor('#94a3b8')
        WHITE   = colors.white

        # ── Background ──────────────────────────────────────────────
        c.setFillColor(WHITE)
        c.rect(0, 0, W, H, fill=1, stroke=0)

        # Subtle top & bottom navy bands
        c.setFillColor(NAVY)
        c.rect(0, H - 28, W, 28, fill=1, stroke=0)
        c.rect(0, 0, W, 22, fill=1, stroke=0)

        # Gold accent bar (top)
        c.setFillColor(GOLD)
        c.rect(0, H - 34, W, 6, fill=1, stroke=0)
        # Gold accent bar (bottom)
        c.rect(0, 22, W, 4, fill=1, stroke=0)

        # Outer double border
        c.setStrokeColor(NAVY)
        c.setLineWidth(3)
        c.rect(14, 30, W - 28, H - 62, stroke=1, fill=0)
        c.setStrokeColor(GOLD)
        c.setLineWidth(1)
        c.rect(18, 34, W - 36, H - 70, stroke=1, fill=0)

        # ── Top band text ────────────────────────────────────────────
        c.setFillColor(WHITE)
        c.setFont('Helvetica-Bold', 11)
        c.drawCentredString(W / 2, H - 19, 'EAGLE INDUSTRY TRAINING PORTAL')

        # ── Main content area ────────────────────────────────────────
        # "CERTIFICATE OF COMPLETION"
        c.setFillColor(NAVY)
        c.setFont('Helvetica-Bold', 34)
        c.drawCentredString(W / 2, H - 90, 'CERTIFICATE OF COMPLETION')

        # Gold underline beneath title
        c.setStrokeColor(GOLD)
        c.setLineWidth(2)
        c.line(W/2 - 160, H - 97, W/2 + 160, H - 97)

        # "This certifies that"
        c.setFillColor(MGRAY)
        c.setFont('Helvetica', 13)
        c.drawCentredString(W / 2, H - 130, 'This certifies that')

        # Trainee name
        c.setFillColor(BLUE)
        c.setFont('Helvetica-Bold', 38)
        c.drawCentredString(W / 2, H - 178, trainee_name)

        # Name underline
        name_w = c.stringWidth(trainee_name, 'Helvetica-Bold', 38)
        c.setStrokeColor(GOLD)
        c.setLineWidth(1.5)
        c.line(W/2 - name_w/2, H - 184, W/2 + name_w/2, H - 184)

        # "has successfully completed"
        c.setFillColor(MGRAY)
        c.setFont('Helvetica', 13)
        c.drawCentredString(W / 2, H - 210, 'has successfully completed')

        # Course title — wrapped if long
        c.setFillColor(NAVY)
        c.setFont('Helvetica-Bold', 22)
        # Simple word-wrap: if too long, split into two lines
        max_w = W - 120
        title_w = c.stringWidth(course_title, 'Helvetica-Bold', 22)
        if title_w <= max_w:
            c.drawCentredString(W / 2, H - 248, course_title)
            detail_y = H - 290
        else:
            words = course_title.split()
            line1, line2 = '', ''
            for word in words:
                test = (line1 + ' ' + word).strip()
                if c.stringWidth(test, 'Helvetica-Bold', 22) <= max_w:
                    line1 = test
                else:
                    line2 = (line2 + ' ' + word).strip()
            c.drawCentredString(W / 2, H - 243, line1)
            c.drawCentredString(W / 2, H - 265, line2)
            detail_y = H - 305

        # ── Details row ──────────────────────────────────────────────
        c.setFont('Helvetica', 12)
        c.setFillColor(colors.HexColor('#374151'))

        # Three centred detail lines
        c.drawCentredString(W / 2, detail_y,       f'on  {issued}')
        if trainer_name:
            c.drawCentredString(W / 2, detail_y - 22, f'Conducted by:  {trainer_name}')
        c.drawCentredString(W / 2, detail_y - 44, f'at  {location}')

        # ── Divider ──────────────────────────────────────────────────
        div_y = detail_y - 68
        c.setStrokeColor(colors.HexColor('#e2e8f0'))
        c.setLineWidth(1)
        c.line(W/2 - 180, div_y, W/2 + 180, div_y)

        # ── Footer info ──────────────────────────────────────────────
        c.setFont('Helvetica', 9)
        c.setFillColor(MGRAY)
        c.drawCentredString(W / 2, div_y - 18, f'Certificate No:  {cert.certificate_number}')
        if expiry:
            c.drawCentredString(W / 2, div_y - 32, f'Valid Until:  {expiry}')

        # ── Bottom band text ─────────────────────────────────────────
        c.setFillColor(WHITE)
        c.setFont('Helvetica', 8)
        c.drawCentredString(W / 2, 8, 'Eagle Industry Training Portal  •  Authorised Training Certificate')

        c.save()
        buffer.seek(0)
        return buffer.read()

    except Exception as e:
        # Fallback plain text PDF
        buffer = io.BytesIO()
        try:
            from reportlab.pdfgen import canvas as rl_canvas
            from reportlab.lib.pagesizes import A4, landscape
            c2 = rl_canvas.Canvas(buffer, pagesize=landscape(A4))
            c2.drawString(50, 400, f"Certificate: {cert.certificate_number}")
            c2.drawString(50, 380, f"Error generating certificate: {str(e)}")
            c2.save()
        except Exception:
            pass
        buffer.seek(0)
        return buffer.read()


# ── QR ENROLLMENT ────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def session_by_qr_token(request, qr_token):
    """Public endpoint — returns session preview. No auth required."""
    try:
        session = Session.objects.select_related('course', 'trainer', 'site_location').get(qr_token=qr_token)
    except Session.DoesNotExist:
        return Response({'error': 'Invalid QR code'}, status=404)

    if session.status not in ('SCHEDULED', 'ONGOING'):
        return Response({
            'error': 'This session is no longer accepting enrollments.',
            'status': session.status,
        }, status=400)

    enrolled = False
    if request.user and request.user.is_authenticated:
        enrolled = session.trainees.filter(id=request.user.id).exists()

    enrolled_count = session.trainees.count()
    seats_remaining = session.max_trainees - enrolled_count

    return Response({
        'id': session.id,
        'title': session.title or session.course.title,
        'course_title': session.course.title,
        'course_description': session.course.description,
        'date': session.start_time.strftime('%B %d, %Y'),
        'scheduled_date': str(session.scheduled_date or session.start_time.date()),
        'start_time': session.start_time.strftime('%I:%M %p'),
        'end_time': session.end_time.strftime('%I:%M %p') if session.end_time else '',
        'trainer_id': session.trainer.employee_id if session.trainer else 'TBD',
        'trainer_name': f"{session.trainer.first_name} {session.trainer.last_name}".strip() if session.trainer else 'TBD',
        'location': session.site_location.name if session.site_location else (session.location or 'Online'),
        'site_location': session.site_location.name if session.site_location else (session.location or 'Online'),
        'meeting_link': session.meeting_link if session.session_type == 'ONLINE' else None,
        'session_type': session.session_type,
        'status': session.status,
        'enrolled_count': enrolled_count,
        'seats_taken': enrolled_count,
        'max_trainees': session.max_trainees,
        'seats_remaining': seats_remaining,
        'is_full': seats_remaining <= 0,
        'already_enrolled': enrolled,
        'qr_token': str(session.qr_token),
        'enrollment_link': session.enrollment_link,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_by_qr_token(request, qr_token):
    """Enrolls the authenticated trainee. Creates Attendance + Progress records."""
    try:
        session = Session.objects.select_related(
            'course', 'trainer', 'site_location'
        ).get(qr_token=str(qr_token))
    except Session.DoesNotExist:
        return Response({'error': 'Invalid QR code. Session not found.'}, status=404)
    except Exception as exc:
        return Response({'error': f'Invalid token format: {exc}'}, status=400)

    user = request.user
    if user.role != 'TRAINEE':
        return Response({'error': 'Only trainees can enroll.'}, status=403)
    if session.status not in ('SCHEDULED', 'ONGOING'):
        return Response(
            {'error': f'Session is {session.status} and not accepting enrollments.'},
            status=400,
        )

    # Already enrolled
    if session.trainees.filter(id=user.id).exists():
        return Response({
            'already_enrolled': True,
            'message': f'Already enrolled in {session.course.title}.',
            'session_id': session.id,
            'course_title': session.course.title,
        }, status=200)

    # Capacity check
    if session.trainees.count() >= session.max_trainees:
        return Response({'error': 'Session is full.'}, status=400)

    # How enrolled — QR scan or direct link
    enrolled_via = request.data.get('enrolled_via', 'QR')
    if enrolled_via not in ('QR', 'LINK', 'MANUAL', 'SELF'):
        enrolled_via = 'QR'

    # 1) session.trainees M2M
    try:
        session.trainees.add(user)
    except Exception as exc:
        return Response({'error': f'Failed to enroll: {exc}'}, status=500)

    # 2) Attendance record
    attendance_defaults = {'status': 'ABSENT'}
    try:
        attendance_defaults['enrolled_via'] = enrolled_via
        Attendance.objects.get_or_create(
            session=session,
            trainee=user,
            defaults=attendance_defaults,
        )
    except TypeError:
        Attendance.objects.get_or_create(
            session=session,
            trainee=user,
            defaults={'status': 'ABSENT'},
        )

    # 3) TraineeSessionProgress record (if model exists)
    try:
        TraineeSessionProgress.objects.get_or_create(
            session=session,
            trainee=user,
            defaults={'progress': 'NOT_STARTED'},
        )
    except Exception:
        pass

    return Response({
        'success': True,
        'message': f'Successfully enrolled in {session.course.title}!',
        'session_id': session.id,
        'course_title': session.course.title,
        'scheduled_date': str(session.scheduled_date or session.start_time.date()),
        'start_time': session.start_time.strftime('%I:%M %p'),
        'session_type': session.session_type,
        'site_location': session.site_location.name if session.site_location else (session.location or 'Online'),
        'trainer_id': session.trainer.employee_id if session.trainer else None,
    }, status=201)


# ── ADMIN ────────────────────────────────────────────────────

@api_view(['GET'])
def admin_dashboard_data(request):
    trainers_qs = User.objects.filter(role='TRAINER')
    trainees_qs = User.objects.filter(role='TRAINEE')
    sessions_qs = Session.objects.all()

    trainers = []
    for t in trainers_qs:
        sc = sessions_qs.filter(trainer=t).count()
        fb = Feedback.objects.filter(session__trainer=t)
        avg_r = fb.aggregate(Avg('overall_rating'))['overall_rating__avg'] or 4.5
        score = min(100, int(85 + (avg_r * 2)))
        trainers.append({
            'id': str(t.id), 'employee_id': t.employee_id or t.username,
            'name': f"{t.first_name} {t.last_name}".strip() or t.username,
            'score': score, 'averageRating': round(avg_r, 1),
            'performance': min(100, score + 5), 'sessionsCount': sc,
        })

    trainees = []
    for t in trainees_qs:
        res = QuizResult.objects.filter(trainee=t)
        avg_p = res.aggregate(Avg('percentage'))['percentage__avg'] or 0
        trainees.append({
            'id': str(t.id), 'employee_id': t.employee_id or t.username,
            'name': f"{t.first_name} {t.last_name}".strip() or t.username,
            'score': round(avg_p), 'department': t.department,
        })

    sessions = []
    for s in sessions_qs.order_by('-start_time')[:20]:
        att = Attendance.objects.filter(session=s)
        present = att.filter(status__in=['PRESENT', 'LATE']).count()
        total = att.count()
        sessions.append({
            'id': str(s.id), 'topic': s.title or s.course.title,
            'date': s.start_time.strftime('%Y-%m-%d'), 'status': s.status,
            'attendancePercentage': round((present / total * 100)) if total > 0 else 0,
            'trainerId': s.trainer.employee_id if s.trainer else None,
            'site': s.site_location.name if s.site_location else 'Online',
        })

    gap = []
    for course in Course.objects.filter(is_active=True):
        res = QuizResult.objects.filter(quiz__course=course)
        if res.exists():
            avg = res.aggregate(Avg('percentage'))['percentage__avg'] or 0
            gap.append({'topic': course.title, 'score': round(avg), 'category': course.category or 'General'})
    gap.sort(key=lambda x: x['score'])

    site_compliance = []
    for site in SiteLocation.objects.filter(is_active=True):
        st = User.objects.filter(role='TRAINEE', site_location=site.name)
        total_t = st.count()
        if total_t == 0:
            continue
        att = Attendance.objects.filter(trainee__in=st)
        att_rate = round((att.filter(status__in=['PRESENT','LATE']).count() / att.count() * 100)) if att.count() > 0 else 0
        certs = Certificate.objects.filter(trainee__in=st, is_valid=True).count()
        cert_rate = round((certs / total_t * 100))
        res = QuizResult.objects.filter(trainee__in=st)
        quiz_rate = round((res.filter(passed=True).count() / res.count() * 100)) if res.count() > 0 else 0
        score = round((att_rate * 0.3) + (cert_rate * 0.3) + (quiz_rate * 0.25) + (15 * 0.15))
        site_compliance.append({'site': site.name, 'safety_readiness_score': score,
            'attendance_rate': att_rate, 'certification_rate': cert_rate, 'quiz_pass_rate': quiz_rate})

    avg_ts = sum(t['score'] for t in trainers) / max(len(trainers), 1)
    return Response({
        'trainers': trainers, 'trainees': trainees, 'sessions': sessions,
        'trainerPerformanceIndex': round(avg_ts, 1), 'gapAnalysis': gap[:5],
        'siteCompliance': site_compliance, 'totalTrainers': len(trainers),
        'totalTrainees': len(trainees), 'totalSessions': sessions_qs.count(),
        'completedSessions': sessions_qs.filter(status='COMPLETED').count(),
    })


@api_view(['GET'])
def admin_analytics(request):
    now = timezone.now()
    monthly = []
    for i in range(5, -1, -1):
        start = now - timedelta(days=30 * (i + 1))
        end = now - timedelta(days=30 * i)
        monthly.append({'month': end.strftime('%b'), 'sessions': Session.objects.filter(start_time__range=(start, end)).count()})

    quiz_trend = []
    for i in range(5, -1, -1):
        start = now - timedelta(days=30 * (i + 1))
        end = now - timedelta(days=30 * i)
        res = QuizResult.objects.filter(attempt_date__range=(start, end))
        total = res.count()
        rate = round((res.filter(passed=True).count() / total * 100)) if total > 0 else 0
        quiz_trend.append({'month': end.strftime('%b'), 'passRate': rate})

    dept_data = {}
    for u in User.objects.filter(role='TRAINEE').exclude(department=''):
        d = u.department
        if d not in dept_data:
            dept_data[d] = {'total': 0, 'completed': 0}
        dept_data[d]['total'] += 1
        if u.enrolled_sessions.filter(status='COMPLETED').exists():
            dept_data[d]['completed'] += 1
    dept_completion = [{'department': d, 'completion': round((v['completed'] / v['total'] * 100)) if v['total'] > 0 else 0} for d, v in dept_data.items()]

    site_attendance = []
    for site in SiteLocation.objects.filter(is_active=True):
        trainees = User.objects.filter(role='TRAINEE', site_location=site.name)
        att = Attendance.objects.filter(trainee__in=trainees)
        present = att.filter(status__in=['PRESENT', 'LATE']).count()
        total = att.count()
        site_attendance.append({'site': site.name, 'attendanceRate': round((present / total * 100)) if total > 0 else 0})

    return Response({'monthlySessions': monthly, 'quizPassTrend': quiz_trend,
                     'deptCompletion': dept_completion, 'siteAttendance': site_attendance})


@api_view(['GET'])
def admin_compliance(request):
    result = []
    for site in SiteLocation.objects.filter(is_active=True):
        st = User.objects.filter(role='TRAINEE', site_location=site.name)
        total_t = st.count()
        att = Attendance.objects.filter(trainee__in=st)
        att_rate = round((att.filter(status__in=['PRESENT','LATE']).count() / att.count() * 100)) if att.count() > 0 else 0
        certs = Certificate.objects.filter(trainee__in=st, is_valid=True).count()
        cert_rate = round((certs / total_t * 100)) if total_t > 0 else 0
        res = QuizResult.objects.filter(trainee__in=st)
        quiz_rate = round((res.filter(passed=True).count() / res.count() * 100)) if res.count() > 0 else 0
        score = round((att_rate * 0.3) + (cert_rate * 0.3) + (quiz_rate * 0.25) + (15 * 0.15))
        result.append({'site': site.name, 'site_id': site.id, 'safety_readiness_score': score,
            'total_trainees': total_t, 'compliance_breakdown': {
                'attendance': att_rate, 'certification': cert_rate,
                'quiz_pass_rate': quiz_rate, 'feedback_submitted': 85}})
    return Response(result)


@api_view(['GET'])
def admin_gap_analysis(request):
    gap = []
    for course in Course.objects.filter(is_active=True):
        res = QuizResult.objects.filter(quiz__course=course)
        if res.exists():
            avg = res.aggregate(Avg('percentage'))['percentage__avg'] or 0
            passed_rate = round((res.filter(passed=True).count() / res.count() * 100))
            gap.append({'topic': course.title, 'category': course.category or 'General',
                'avg_score': round(avg, 1), 'pass_rate': passed_rate, 'attempts': res.count(),
                'status': 'critical' if avg < 60 else ('warning' if avg < 75 else 'good')})
    gap.sort(key=lambda x: x['avg_score'])
    return Response(gap)


@api_view(['GET'])
def admin_attendance_audit(request):
    records = []
    for att in Attendance.objects.select_related('session', 'trainee', 'session__site_location').order_by('-session__start_time')[:200]:
        records.append({
            'trainee_id': att.trainee.employee_id or att.trainee.username,
            'trainee_name': f"{att.trainee.first_name} {att.trainee.last_name}".strip() or att.trainee.username,
            'session': att.session.title or att.session.course.title,
            'date': att.session.start_time.strftime('%Y-%m-%d'),
            'check_in': att.check_in_time.strftime('%H:%M') if att.check_in_time else None,
            'check_out': att.check_out_time.strftime('%H:%M') if att.check_out_time else None,
            'status': att.status,
            'site': att.session.site_location.name if att.session.site_location else 'Online',
        })
    return Response(records)


# ── TRAINER ──────────────────────────────────────────────────

@api_view(['GET'])
def trainer_dashboard_data(request, user_id):
    try:
        user = User.objects.get(id=user_id, role='TRAINER')
    except User.DoesNotExist:
        return Response({'error': 'Trainer not found'}, status=404)
    now = timezone.now()
    ts = Session.objects.filter(trainer=user)
    total_s = ts.count()
    completed_s = ts.filter(status='COMPLETED').count()
    training_completion = round((completed_s / total_s * 100)) if total_s > 0 else 0
    active_trainees = User.objects.filter(enrolled_sessions__in=ts.exclude(status='COMPLETED')).distinct().count()
    trainer_courses = Course.objects.filter(sessions__trainer=user).distinct()
    results = QuizResult.objects.filter(quiz__course__in=trainer_courses)
    ts_sum = sum(r.score for r in results); tm_sum = sum(r.total_score for r in results)
    average_score = round((ts_sum / tm_sum * 100)) if tm_sum > 0 else 0
    attendances = Attendance.objects.filter(session__in=ts)
    present = attendances.filter(status__in=['PRESENT', 'LATE']).count()
    compliance_rate = round((present / attendances.count() * 100)) if attendances.count() > 0 else 0
    upcoming = ts.filter(start_time__gte=now, status='SCHEDULED').order_by('start_time')[:3]
    recent_sessions = [{'id': s.id, 'title': s.title or s.course.title,
        'month': s.start_time.strftime('%b').upper(), 'day': s.start_time.strftime('%d'),
        'time': f"{s.start_time.strftime('%I:%M %p')} - {s.end_time.strftime('%I:%M %p')}", 'status': s.status}
        for s in upcoming]
    chart_data = []
    for i in range(5, -1, -1):
        end_d = now - timedelta(days=30 * i); start_d = end_d - timedelta(days=30)
        mq = results.filter(attempt_date__range=(start_d, end_d))
        ms = sum(r.score for r in mq); mm = sum(r.total_score for r in mq)
        ms_pct = round((ms / mm * 100)) if mm > 0 else 0
        ma = attendances.filter(session__start_time__range=(start_d, end_d))
        ma_pct = round((ma.filter(status__in=['PRESENT','LATE']).count() / ma.count() * 100)) if ma.count() > 0 else 0
        chart_data.append({'name': end_d.strftime('%b'), 'score': ms_pct, 'attendance': ma_pct})
    feedbacks = Feedback.objects.filter(session__in=ts)
    avg_rating = feedbacks.aggregate(Avg('overall_rating'))['overall_rating__avg'] or 5.0
    perf_index = round(((avg_rating / 5.0) * 100 * 0.6) + (average_score * 0.4))
    return Response({'activeTrainees': active_trainees, 'trainingCompletion': training_completion,
        'averageScore': average_score, 'complianceRate': compliance_rate,
        'performanceData': chart_data, 'recentSessions': recent_sessions,
        'performanceIndex': perf_index, 'feedbackRating': round(avg_rating, 1)})


@api_view(['GET'])
def trainer_sessions(request, user_id):
    try:
        user = User.objects.get(id=user_id, role='TRAINER')
    except User.DoesNotExist:
        return Response({'error': 'Trainer not found'}, status=404)
    sessions = Session.objects.filter(trainer=user).order_by('-start_time')
    data = []
    for s in sessions:
        att = Attendance.objects.filter(session=s)
        data.append({'id': s.id, 'title': s.title or s.course.title, 'course': s.course.title,
            'date': s.start_time.strftime('%Y-%m-%d'), 'time': s.start_time.strftime('%I:%M %p'),
            'session_type': s.session_type, 'status': s.status,
            'location': s.site_location.name if s.site_location else (s.location or 'Online'),
            'enrolled': s.trainees.count(), 'max_trainees': s.max_trainees,
            'attendance_present': att.filter(status__in=['PRESENT','LATE']).count(),
            'qr_token': str(s.qr_token), 'enrollment_link': s.enrollment_link})
    return Response(data)


@api_view(['GET'])
def trainer_trainees(request, user_id):
    try:
        user = User.objects.get(id=user_id, role='TRAINER')
    except User.DoesNotExist:
        return Response({'error': 'Trainer not found'}, status=404)
    trainees = User.objects.filter(enrolled_sessions__trainer=user, role='TRAINEE').distinct()
    data = []
    for t in trainees:
        res = QuizResult.objects.filter(trainee=t)
        avg = res.aggregate(Avg('percentage'))['percentage__avg'] or 0
        att = Attendance.objects.filter(trainee=t, session__trainer=user)
        att_rate = round((att.filter(status__in=['PRESENT','LATE']).count() / att.count() * 100)) if att.count() > 0 else 0
        data.append({'employee_id': t.employee_id or t.username, 'department': t.department,
            'avg_score': round(avg, 1), 'attendance_rate': att_rate,
            'sessions_enrolled': t.enrolled_sessions.filter(trainer=user).count()})
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trainer_trainee_performance(request, user_id):
    """Trainer sees performance of only their own trainees."""
    try:
        trainer = User.objects.get(id=user_id, role='TRAINER')
    except User.DoesNotExist:
        return Response({'error': 'Trainer not found'}, status=404)

    if request.user.id != trainer.id and request.user.role != 'ADMIN':
        return Response({'error': 'Forbidden'}, status=403)

    trainer_sessions = Session.objects.filter(trainer=trainer)
    trainee_ids = trainer_sessions.values_list('trainees__id', flat=True).distinct()
    trainees = User.objects.filter(id__in=trainee_ids, role='TRAINEE')

    result = []
    for trainee in trainees:
        attendances = Attendance.objects.filter(
            trainee=trainee,
            session__in=trainer_sessions
        )
        total_att = attendances.count()
        present_att = attendances.filter(status__in=['PRESENT', 'LATE']).count()
        attendance_rate = round(present_att / max(total_att, 1) * 100, 1)

        quiz_results = QuizResult.objects.filter(
            trainee=trainee,
            session__in=trainer_sessions
        )
        total_quizzes = quiz_results.count()
        passed_quizzes = quiz_results.filter(passed=True).count()
        avg_score = quiz_results.aggregate(avg=Avg('percentage'))['avg'] or 0
        pass_rate = round(passed_quizzes / max(total_quizzes, 1) * 100, 1)

        trainer_fb = TrainerFeedback.objects.filter(
            trainer=trainer,
            trainee=trainee
        ).order_by('-submitted_at').first()

        trainee_fb = Feedback.objects.filter(
            trainee=trainee,
            session__in=trainer_sessions
        ).aggregate(avg=Avg('overall_rating'))['avg'] or 0

        certs = Certificate.objects.filter(
            trainee=trainee,
            session__in=trainer_sessions
        ).count()

        trainer_eval_score = 0
        if trainer_fb:
            trainer_eval_score = (
                trainer_fb.discipline_score +
                trainer_fb.aptitude_score +
                trainer_fb.participation_score +
                trainer_fb.overall_score
            ) / 4

        composite = round(
            attendance_rate * 0.30 +
            pass_rate * 0.30 +
            avg_score * 0.25 +
            (trainer_eval_score * 10) * 0.15,
            1
        )

        result.append({
            'trainee_id': trainee.employee_id or trainee.username,
            'full_name': trainee.get_full_name(),
            'department': trainee.department,
            'site': trainee.site_assignment.name if trainee.site_assignment else '',
            'sessions_enrolled': total_att,
            'attendance_rate': attendance_rate,
            'avg_quiz_score': round(avg_score, 1),
            'quiz_pass_rate': pass_rate,
            'certificates_earned': certs,
            'trainer_evaluation': round(trainer_eval_score, 1) if trainer_fb else None,
            'trainee_feedback': round(trainee_fb, 1),
            'composite_score': composite,
        })

    result.sort(key=lambda x: x['composite_score'], reverse=True)
    for i, item in enumerate(result):
        item['rank'] = i + 1

    return Response({
        'trainer_id': trainer.employee_id or trainer.username,
        'total_trainees': len(result),
        'trainees': result,
    })


@api_view(['GET'])
def leaderboard(request):
    trainers = User.objects.filter(role='TRAINER')
    board = []
    for t in trainers:
        t_sessions = Session.objects.filter(trainer=t)
        completed = t_sessions.filter(status='COMPLETED').count()
        feedbacks = Feedback.objects.filter(session__in=t_sessions)
        avg_fb = feedbacks.aggregate(Avg('overall_rating'))['overall_rating__avg'] or 0
        trainees_trained = User.objects.filter(enrolled_sessions__in=t_sessions.filter(status='COMPLETED')).distinct().count()
        att = Attendance.objects.filter(session__in=t_sessions)
        att_rate = round((att.filter(status__in=['PRESENT','LATE']).count() / att.count() * 100)) if att.count() > 0 else 0
        results = QuizResult.objects.filter(quiz__course__sessions__trainer=t)
        pass_rate = round((results.filter(passed=True).count() / results.count() * 100)) if results.count() > 0 else 0
        composite = round(((avg_fb / 5.0) * 100 * 0.30) + (pass_rate * 0.25) + (att_rate * 0.20) +
                          (min(completed * 10, 100) * 0.15) + (min(trainees_trained * 5, 100) * 0.10), 1)
        board.append({'trainer_id': t.employee_id or t.username, 'trainer_db_id': t.id,
            'avg_feedback_score': round(avg_fb, 1), 'sessions_completed': completed,
            'trainees_trained': trainees_trained, 'pass_rate': pass_rate,
            'attendance_rate': att_rate, 'composite_score': composite})
    board.sort(key=lambda x: x['composite_score'], reverse=True)
    for i, item in enumerate(board):
        item['rank'] = i + 1
    return Response(board)


# ── TRAINEE ──────────────────────────────────────────────────

@api_view(['GET'])
def trainee_dashboard_data(request, user_id):
    try:
        user = User.objects.get(id=user_id, role='TRAINEE')
    except User.DoesNotExist:
        return Response({'error': 'Trainee not found'}, status=404)
    now = timezone.now()
    enrolled = user.enrolled_sessions.all()
    results = QuizResult.objects.filter(trainee=user)
    avg_score = round(results.aggregate(Avg('percentage'))['percentage__avg'] or 0, 1)
    certs = Certificate.objects.filter(trainee=user, is_valid=True).count()
    pending_fb = Session.objects.filter(trainees=user, status='COMPLETED').exclude(feedbacks__trainee=user).count()
    upcoming = enrolled.filter(start_time__gte=now, status='SCHEDULED').order_by('start_time')[:3]
    schedule_data = [{'title': s.title or s.course.title, 'time': s.start_time.strftime('%I:%M %p'),
        'date': s.start_time.strftime('%Y-%m-%d'), 'type': s.session_type, 'id': str(s.id)} for s in upcoming]
    recent_results = [{'quiz': r.quiz.title, 'score': r.score, 'total': r.total_score,
        'percentage': r.percentage, 'passed': r.passed,
        'date': r.attempt_date.strftime('%Y-%m-%d') if r.attempt_date else ''} for r in results.order_by('-attempt_date')[:5]]
    return Response({'stats': {'coursesCompleted': enrolled.filter(status='COMPLETED').count(),
        'ongoingCourses': enrolled.exclude(status__in=['COMPLETED','CANCELLED']).count(),
        'upcomingSessions': enrolled.filter(start_time__gte=now, status='SCHEDULED').count(),
        'overallScore': avg_score, 'certificatesEarned': certs, 'pendingFeedback': pending_fb},
        'schedule': schedule_data, 'recentQuizResults': recent_results})


@api_view(['GET'])
def trainee_upcoming_sessions(request, user_id):
    try:
        user = User.objects.get(id=user_id, role='TRAINEE')
    except User.DoesNotExist:
        return Response({'error': 'Trainee not found'}, status=404)
    now = timezone.now()
    sessions = user.enrolled_sessions.filter(
        status__in=['SCHEDULED', 'ONGOING']
    ).select_related('course', 'trainer', 'site_location').order_by('start_time')
    result = []
    for s in sessions:
        try:
            prog = TraineeSessionProgress.objects.get(session=s, trainee=user)
            progress = prog.progress
        except TraineeSessionProgress.DoesNotExist:
            progress = 'NOT_STARTED'
        result.append({
            'id': str(s.id),
            'title': s.title or s.course.title,
            'course': s.course.title,
            'course_title': s.course.title,
            'trainer_id': s.trainer.employee_id if s.trainer else 'TBD',
            'trainer_name': f"{s.trainer.first_name} {s.trainer.last_name}".strip() if s.trainer else 'TBD',
            'date': s.start_time.strftime('%Y-%m-%d'),
            'time': s.start_time.strftime('%I:%M %p'),
            'start_time': s.start_time.isoformat(),
            'end_time': s.end_time.isoformat() if s.end_time else None,
            'session_type': s.session_type,
            'location': s.site_location.name if s.site_location else (s.location or 'Online'),
            'meeting_link': s.meeting_link,
            'status': s.status,
            'progress': progress,
            'can_unenroll': (s.start_time - now).total_seconds() > 86400,
        })
    return Response(result)


@api_view(['GET'])
def trainee_available_sessions(request, user_id):
    try:
        user = User.objects.get(id=user_id, role='TRAINEE')
    except User.DoesNotExist:
        return Response({'error': 'Trainee not found'}, status=404)
    now = timezone.now()
    enrolled_ids = user.enrolled_sessions.values_list('id', flat=True)
    available = Session.objects.filter(
        start_time__gte=now, status='SCHEDULED'
    ).exclude(id__in=enrolled_ids).select_related(
        'course', 'trainer', 'site_location'
    ).order_by('start_time')
    result = []
    for s in available:
        enrolled_count = s.trainees.count()
        seats_remaining = s.max_trainees - enrolled_count
        result.append({
            'id': str(s.id),
            'title': s.title or s.course.title,
            'course': s.course.title,
            'course_description': s.course.description,
            'trainer_id': s.trainer.employee_id if s.trainer else 'TBD',
            'trainer_name': f"{s.trainer.first_name} {s.trainer.last_name}".strip() if s.trainer else 'TBD',
            'date': s.start_time.strftime('%Y-%m-%d'),
            'time': s.start_time.strftime('%I:%M %p'),
            'session_type': s.session_type,
            'location': s.site_location.name if s.site_location else (s.location or 'Online'),
            'meeting_link': s.meeting_link,
            'enrolled_count': enrolled_count,
            'max_trainees': s.max_trainees,
            'seats_remaining': seats_remaining,
            'is_full': seats_remaining <= 0,
            'qr_token': str(s.qr_token),
            'enrollment_link': s.enrollment_link,
        })
    return Response(result)


@api_view(['POST'])
def enroll_session(request, user_id, session_id):
    try:
        user = User.objects.get(id=user_id, role='TRAINEE')
        session = Session.objects.get(id=session_id)
    except (User.DoesNotExist, Session.DoesNotExist):
        return Response({'error': 'Not found'}, status=404)
    if session.trainees.filter(id=user.id).exists():
        return Response({'message': 'Already enrolled', 'already_enrolled': True}, status=200)
    if session.trainees.count() >= session.max_trainees:
        return Response({'error': 'Session is full'}, status=400)
    # Enroll across all 3 tables
    session.trainees.add(user)
    Attendance.objects.get_or_create(
        session=session, trainee=user,
        defaults={'status': 'ABSENT', 'enrolled_via': 'SELF'}
    )
    TraineeSessionProgress.objects.get_or_create(
        session=session, trainee=user,
        defaults={'progress': 'NOT_STARTED'}
    )
    return Response({'message': 'Successfully enrolled!', 'session_id': session.id}, status=200)


@api_view(['DELETE'])
def unenroll_session(request, user_id, session_id):
    try:
        user = User.objects.get(id=user_id, role='TRAINEE')
        session = Session.objects.get(id=session_id)
    except (User.DoesNotExist, Session.DoesNotExist):
        return Response({'error': 'Not found'}, status=404)
    now = timezone.now()
    if (session.start_time - now).total_seconds() < 86400:
        return Response({'error': 'Cannot unenroll less than 24h before session'}, status=400)
    session.trainees.remove(user)
    Attendance.objects.filter(session=session, trainee=user).delete()
    return Response({'message': 'Unenrolled'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trainee_completed_sessions(request, user_id):
    """Returns sessions the trainee has completed (attended + session status=COMPLETED)."""
    try:
        trainee = User.objects.get(id=user_id, role='TRAINEE')
    except User.DoesNotExist:
        return Response({'error': 'Trainee not found'}, status=404)

    if request.user.id != trainee.id and request.user.role not in ['ADMIN', 'TRAINER']:
        return Response({'error': 'Forbidden'}, status=403)

    completed_sessions = Session.objects.filter(
        trainees=trainee,
        status='COMPLETED'
    ).select_related(
        'course', 'trainer', 'site_location'
    ).order_by('-scheduled_date')

    result = []
    for session in completed_sessions:
        # Attendance record
        try:
            att = Attendance.objects.get(session=session, trainee=trainee)
            att_status = att.status
            check_in = str(att.check_in_time) if att.check_in_time else None
        except Attendance.DoesNotExist:
            att_status = 'ABSENT'
            check_in = None

        # Quiz result (latest attempt)
        quiz_result = QuizResult.objects.filter(
            trainee=trainee,
            session=session
        ).order_by('-attempt_date').first()

        # Feedback submitted?
        feedback_submitted = Feedback.objects.filter(
            session=session,
            trainee=trainee
        ).exists()

        # Certificate earned?
        certificate = Certificate.objects.filter(
            session=session,
            trainee=trainee
        ).first()

        # Progress
        try:
            progress = TraineeSessionProgress.objects.get(
                session=session, trainee=trainee
            )
            progress_value = progress.progress
        except TraineeSessionProgress.DoesNotExist:
            progress_value = 'NOT_STARTED'

        result.append({
            'session_id': session.id,
            'id': str(session.id),
            'title': session.title or session.course.title,
            'course': session.course.title if session.course else '',
            'course_title': session.course.title if session.course else '',
            'session_type': session.session_type,
            'scheduled_date': str(session.scheduled_date),
            'start_time': str(session.start_time),
            'end_time': str(session.end_time),
            'trainer_id': session.trainer.employee_id if session.trainer else '',
            'trainer_name': f"{session.trainer.first_name} {session.trainer.last_name}".strip() if session.trainer else 'TBD',
            'site_location': session.site_location.name if session.site_location else 'Online',
            'date': session.start_time.strftime('%Y-%m-%d'),
            'attendance_status': att_status,
            'check_in_time': check_in,
            'quiz_score': quiz_result.percentage if quiz_result else None,
            'quiz_passed': quiz_result.passed if quiz_result else None,
            'feedback_submitted': feedback_submitted,
            'feedback_given': feedback_submitted,
            'certificate_id': certificate.id if certificate else None,
            'certificate_number': certificate.certificate_number if certificate else None,
            'progress': progress_value,
            'attended': att_status in ('PRESENT', 'LATE'),
        })

    return Response(result)


@api_view(['GET'])
def trainee_report_card(request, user_id):
    try:
        user = User.objects.get(id=user_id, role='TRAINEE')
    except User.DoesNotExist:
        return Response({'error': 'Trainee not found'}, status=404)
    total_enrolled = user.enrolled_sessions.count()
    attended = Attendance.objects.filter(trainee=user, status__in=['PRESENT', 'LATE']).count()
    att_rate = round((attended / total_enrolled * 100)) if total_enrolled > 0 else 0
    results = QuizResult.objects.filter(trainee=user).select_related('quiz')
    quiz_data = []
    ts = 0; tm = 0
    for qr in results:
        pct = qr.percentage; ts += qr.score; tm += qr.total_score
        reco = qr.recommendations or (
            'Significant review required.' if pct < 50 else
            'Good effort, focus on weak areas.' if pct < 75 else
            'Great job! Review incorrect answers.' if pct < 90 else
            'Exceptional performance!')
        quiz_data.append({'quiz_id': qr.quiz.id, 'quiz_title': qr.quiz.title,
            'score': qr.score, 'total_score': qr.total_score, 'percentage': round(pct, 2),
            'passed': qr.passed, 'completed_at': qr.attempt_date, 'recommendations': reco})
    overall_pct = round((ts / tm * 100)) if tm > 0 else 0
    level = 'Excellent' if overall_pct >= 90 else ('Good' if overall_pct >= 75 else ('Needs Improvement' if overall_pct >= 50 else 'Critical Priority'))
    trainer_feedbacks = TrainerFeedback.objects.filter(trainee=user).select_related('trainer', 'session')
    feedback_data = [{'trainer': 'Trainer Evaluation',
        'session': f.session.title if f.session else 'General',
        'discipline_score': f.discipline_score, 'aptitude_score': f.aptitude_score,
        'participation_score': f.participation_score, 'overall_score': f.overall_score,
        'comment': f.comments, 'recommendations': f.recommendations,
        'date': f.submitted_at.strftime('%Y-%m-%d') if f.submitted_at else 'N/A'} for f in trainer_feedbacks]
    return Response({'trainee': {'id': user.id, 'employee_id': user.employee_id or user.username,
        'name': f"{user.first_name} {user.last_name}".strip() or user.username,
        'department': user.department, 'site_location': user.site_location},
        'attendance': {'total_enrolled': total_enrolled, 'attended': attended, 'rate': att_rate},
        'quiz_scores': quiz_data,
        'score_analysis': {'overall_percentage': overall_pct, 'total_quizzes_taken': results.count(),
            'performance_level': level, 'passes': results.filter(passed=True).count()},
        'trainer_feedbacks': feedback_data,
        'certificates_count': Certificate.objects.filter(trainee=user, is_valid=True).count()})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trainee_attendance_data(request, user_id):
    """Returns all attendance records for a trainee."""
    try:
        trainee = User.objects.get(id=user_id, role='TRAINEE')
    except User.DoesNotExist:
        return Response({'error': 'Trainee not found'}, status=404)

    if request.user.id != trainee.id and request.user.role not in ['ADMIN', 'TRAINER']:
        return Response({'error': 'Forbidden'}, status=403)

    total = trainee.enrolled_sessions.count()
    attendances = Attendance.objects.filter(
        trainee=trainee
    ).select_related(
        'session',
        'session__course',
        'session__trainer',
        'session__site_location'
    ).order_by('-session__scheduled_date')

    attended = attendances.filter(status__in=['PRESENT', 'LATE']).count()
    late = attendances.filter(status='LATE').count()
    att_rate = round((attended / total * 100), 1) if total > 0 else 0

    history = []
    for r in attendances:
        session = r.session
        history.append({
            'date': session.start_time.strftime('%Y-%m-%d'),
            'display_date': session.start_time.strftime('%b %d, %Y'),
            'session': session.title or (session.course.title if session.course else 'Session'),
            'status': r.status,
            'time': r.check_in_time.strftime('%H:%M') if r.check_in_time else session.start_time.strftime('%H:%M'),
            'check_in': r.check_in_time.strftime('%H:%M') if r.check_in_time else None,
            'check_out': r.check_out_time.strftime('%H:%M') if r.check_out_time else None,
            'location': session.site_location.name if session.site_location else 'Online',
        })

    return Response({
        'attendanceRate': att_rate,
        'attended': attended,
        'late': late,
        'totalEnrolled': total,
        'history': history,
    })


@api_view(['GET'])
def trainee_certificates(request, user_id):
    try:
        user = User.objects.get(id=user_id, role='TRAINEE')
    except User.DoesNotExist:
        return Response({'error': 'Trainee not found'}, status=404)
    certs = Certificate.objects.filter(trainee=user).select_related('course', 'session')
    return Response([{'id': c.id, 'certificate_number': c.certificate_number,
        'course': c.course.title,
        'session_date': c.session.start_time.strftime('%Y-%m-%d'),
        'issued_date': c.issued_date.strftime('%Y-%m-%d') if c.issued_date else None,
        'is_valid': c.is_valid,
        'trainer_id': c.session.trainer.employee_id if c.session.trainer else 'N/A',
        'location': c.session.site_location.name if c.session.site_location else 'Online'} for c in certs])


# ── CLIENT ───────────────────────────────────────────────────

@api_view(['GET'])
def client_dashboard_data(request, client_id):
    try:
        client = User.objects.get(id=client_id, role='CLIENT')
    except User.DoesNotExist:
        return Response({'error': 'Client not found'}, status=404)
    site_name = client.managed_site or client.site_location or ''
    st = User.objects.filter(role='TRAINEE', site_location=site_name)
    total_t = st.count()
    att = Attendance.objects.filter(trainee__in=st)
    att_rate = round((att.filter(status__in=['PRESENT','LATE']).count() / att.count() * 100)) if att.count() > 0 else 0
    certs = Certificate.objects.filter(trainee__in=st, is_valid=True)
    cert_rate = round((certs.count() / total_t * 100)) if total_t > 0 else 0
    res = QuizResult.objects.filter(trainee__in=st)
    quiz_rate = round((res.filter(passed=True).count() / res.count() * 100)) if res.count() > 0 else 0
    fb = Feedback.objects.filter(trainee__in=st)
    fb_rate = round((fb.values('trainee').distinct().count() / max(total_t, 1) * 100))
    score = round((att_rate * 0.3) + (cert_rate * 0.3) + (quiz_rate * 0.25) + (fb_rate * 0.15))
    risk_flags = []
    uncertified = st.exclude(certificates__is_valid=True).count()
    if uncertified > 0:
        risk_flags.append(f"{uncertified} trainees have not earned any certificate")
    low_att = st.filter(attendances__status='ABSENT').distinct().count()
    if low_att > 0:
        risk_flags.append(f"{low_att} trainees have missed at least one session")
    recent_sessions = Session.objects.filter(trainees__in=st).distinct().order_by('-start_time')[:5]
    sessions_data = [{'id': s.id, 'title': s.title or s.course.title,
        'date': s.start_time.strftime('%Y-%m-%d'), 'status': s.status,
        'trainer_id': s.trainer.employee_id if s.trainer else 'N/A'} for s in recent_sessions]
    trainees_list = []
    for t in st:
        t_att = Attendance.objects.filter(trainee=t)
        t_att_rate = round((t_att.filter(status__in=['PRESENT','LATE']).count() / t_att.count() * 100)) if t_att.count() > 0 else 0
        t_res = QuizResult.objects.filter(trainee=t)
        t_quiz = round((t_res.filter(passed=True).count() / t_res.count() * 100)) if t_res.count() > 0 else 0
        t_certs = Certificate.objects.filter(trainee=t, is_valid=True).count()
        trainees_list.append({'employee_id': t.employee_id or t.username,
            'name': f"{t.first_name} {t.last_name}".strip() or t.username,
            'department': t.department, 'attendance_rate': t_att_rate,
            'certificates': t_certs, 'quiz_pass_rate': t_quiz, 'certified': t_certs > 0})
    return Response({'site_name': site_name, 'safety_readiness_score': score,
        'total_trainees': total_t, 'certified_trainees': certs.values('trainee').distinct().count(),
        'attendance_rate': att_rate,
        'sessions_completed': Session.objects.filter(trainees__in=st, status='COMPLETED').distinct().count(),
        'sessions_upcoming': Session.objects.filter(trainees__in=st, status='SCHEDULED').distinct().count(),
        'compliance_breakdown': {'attendance': att_rate, 'certification': cert_rate,
            'quiz_pass_rate': quiz_rate, 'feedback_submitted': fb_rate},
        'recent_sessions': sessions_data, 'risk_flags': risk_flags, 'trainees': trainees_list,
        'totalTrainees': total_t, 'totalTrainings': Course.objects.count(),
        'safetyReadiness': score, 'avgAttendance': att_rate, 'avgPerformance': quiz_rate})


@api_view(['GET'])
def client_compliance(request, client_id):
    try:
        client = User.objects.get(id=client_id, role='CLIENT')
    except User.DoesNotExist:
        return Response({'error': 'Client not found'}, status=404)
    site_name = client.managed_site or client.site_location or ''
    trainees = User.objects.filter(role='TRAINEE', site_location=site_name)
    data = []
    for t in trainees:
        att = Attendance.objects.filter(trainee=t)
        present = att.filter(status__in=['PRESENT', 'LATE']).count()
        certs = Certificate.objects.filter(trainee=t, is_valid=True).count()
        res = QuizResult.objects.filter(trainee=t)
        passed = res.filter(passed=True).count()
        last = t.enrolled_sessions.filter(status='COMPLETED').order_by('-start_time').first()
        data.append({'employee_id': t.employee_id or t.username,
            'name': f"{t.first_name} {t.last_name}".strip() or t.username,
            'department': t.department, 'sessions_attended': present,
            'total_sessions': att.count(), 'certificates': certs, 'quizzes_passed': passed,
            'last_training_date': last.start_time.strftime('%Y-%m-%d') if last else None,
            'status': 'Compliant' if certs > 0 and present > 0 else 'Non-Compliant'})
    return Response({'site': site_name, 'trainees': data})


# ── SELF-AUTH CONVENIENCE ENDPOINTS (no user_id in URL) ──────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_analytics_self(request):
    """Full analytics for admin dashboard. Returns data for charts + summary."""
    trainee_qs = User.objects.filter(role='TRAINEE')
    total_trainees = trainee_qs.count()
    completed_at_least_one = trainee_qs.filter(enrolled_sessions__status='COMPLETED').distinct().count()
    completion_rate = round((completed_at_least_one / total_trainees * 100)) if total_trainees > 0 else 0

    # Per-course completion
    trainee_progress = []
    for course in Course.objects.filter(is_active=True)[:10]:
        total = User.objects.filter(enrolled_sessions__course=course).distinct().count()
        completed = User.objects.filter(enrolled_sessions__course=course, enrolled_sessions__status='COMPLETED').distinct().count()
        trainee_progress.append({
            'name': course.title[:20],
            'completed': completed,
            'total': total,
            'percentage': round((completed / total * 100)) if total > 0 else 0,
        })

    # Gap analysis: courses with most un-trained trainees
    gap_analysis = []
    for course in Course.objects.filter(is_active=True)[:8]:
        enrolled = User.objects.filter(enrolled_sessions__course=course, role='TRAINEE').distinct().count()
        gap = max(0, total_trainees - enrolled)
        gap_analysis.append({'name': course.title[:20], 'gap': gap})
    gap_analysis.sort(key=lambda x: x['gap'], reverse=True)

    # Compliance by department
    dept_compliance = {}
    for t in trainee_qs.exclude(department=''):
        d = t.department
        if d not in dept_compliance:
            dept_compliance[d] = {'total': 0, 'compliant': 0}
        dept_compliance[d]['total'] += 1
        att = Attendance.objects.filter(trainee=t)
        rate = round((att.filter(status__in=['PRESENT','LATE']).count() / att.count() * 100)) if att.count() > 0 else 0
        if rate >= 75:
            dept_compliance[d]['compliant'] += 1
    compliance_by_dept = [
        {'name': d, 'value': round(v['compliant'] / v['total'] * 100) if v['total'] > 0 else 0}
        for d, v in dept_compliance.items()
    ]

    # Monthly trend (last 6 months)
    now = timezone.now()
    monthly_trend = []
    for i in range(5, -1, -1):
        start = now - timedelta(days=30 * (i + 1))
        end = now - timedelta(days=30 * i)
        sessions_done = Session.objects.filter(start_time__range=(start, end), status='COMPLETED').count()
        completions = Attendance.objects.filter(session__start_time__range=(start, end), status='PRESENT').count()
        monthly_trend.append({
            'name': end.strftime('%b'),
            'trainings': sessions_done,
            'completions': completions,
            'non_compliance': max(0, total_trainees - completions // max(sessions_done, 1)),
        })

    # Overall compliance
    all_att = Attendance.objects.filter(trainee__in=trainee_qs)
    compliance_rate = round((all_att.filter(status__in=['PRESENT','LATE']).count() / all_att.count() * 100)) if all_att.count() > 0 else 0
    all_quiz = QuizResult.objects.filter(trainee__in=trainee_qs)
    mandatory_completion_rate = round((all_quiz.filter(passed=True).count() / all_quiz.count() * 100)) if all_quiz.count() > 0 else 0

    return Response({
        'trainee_progress': trainee_progress,
        'gap_analysis': gap_analysis,
        'compliance_by_dept': compliance_by_dept,
        'monthly_trend': monthly_trend,
        'summary': {
            'total_trainees': total_trainees,
            'completed_at_least_one': completed_at_least_one,
            'completion_rate': completion_rate,
            'compliance_rate': compliance_rate,
            'mandatory_completion_rate': mandatory_completion_rate,
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_feedback_summary(request):
    """Feedback summary for admin - all feedback with nested detail."""
    feedbacks = Feedback.objects.select_related('session', 'trainee', 'session__trainer').order_by('-submitted_at')
    total = feedbacks.count()
    avg_overall = round(feedbacks.aggregate(Avg('overall_rating'))['overall_rating__avg'] or 0, 1)
    avg_trainer = round(feedbacks.aggregate(Avg('trainer_rating'))['trainer_rating__avg'] or 0, 1)
    avg_content = round(feedbacks.aggregate(Avg('content_rating'))['content_rating__avg'] or 0, 1)

    data = []
    for f in feedbacks[:100]:
        trainer = f.session.trainer if f.session else None
        data.append({
            'id': f.id,
            'session': f.session_id,
            'session_title': (f.session.title or (f.session.course.title if f.session and f.session.course else '')) if f.session else '',
            'trainee_name': f'{f.trainee.first_name} {f.trainee.last_name}'.strip() or f.trainee.username,
            'trainer_name': f'{trainer.first_name} {trainer.last_name}'.strip() or trainer.username if trainer else '—',
            'trainer_rating': f.trainer_rating,
            'content_rating': f.content_rating,
            'venue_rating': f.venue_rating,
            'overall_rating': f.overall_rating,
            'comments': f.comments or '',
            'submitted_at': f.submitted_at.isoformat() if f.submitted_at else None,
        })

    return Response({'total': total, 'avg_overall': avg_overall, 'avg_trainer': avg_trainer, 'avg_content': avg_content, 'feedbacks': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trainer_sessions_self(request):
    """Return sessions for the currently authenticated trainer."""
    user = request.user
    sessions_qs = Session.objects.filter(trainer=user).select_related('course').order_by('-start_time')
    data = []
    for s in sessions_qs:
        data.append({
            'id': s.id,
            'title': s.title or (s.course.title if s.course else ''),
            'course_title': s.course.title if s.course else '',
            'start_time': s.start_time.isoformat(),
            'end_time': s.end_time.isoformat(),
            'status': s.status,
            'session_type': s.session_type,
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trainer_session_trainees(request, session_id):
    """Return trainees enrolled in a session with attendance + progress data."""
    try:
        session = Session.objects.select_related('course').get(id=session_id)
    except Session.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)

    # Trainer can only view their own sessions; admin can view all
    if request.user.role == 'TRAINER' and session.trainer != request.user:
        return Response({'error': 'Not your session'}, status=403)

    data = []
    for t in session.trainees.all():
        # Attendance
        try:
            att = Attendance.objects.get(session=session, trainee=t)
            att_status = att.status
            enrolled_via = att.enrolled_via
        except Attendance.DoesNotExist:
            att_status = 'ABSENT'
            enrolled_via = 'MANUAL'

        # Progress
        try:
            prog = TraineeSessionProgress.objects.get(session=session, trainee=t)
            progress = prog.progress
        except TraineeSessionProgress.DoesNotExist:
            progress = 'NOT_STARTED'

        data.append({
            'id': t.id,
            'name': f'{t.first_name} {t.last_name}'.strip() or t.username,
            'employee_id': t.employee_id or t.username,
            'department': t.department or '—',
            'site': t.site_assignment.name if t.site_assignment else '—',
            'attendance_status': att_status,
            'enrolled_via': enrolled_via,
            'progress': progress,
        })

    return Response({
        'session_id': session.id,
        'course_title': session.course.title,
        'total_enrolled': len(data),
        'max_trainees': session.max_trainees,
        'seats_remaining': session.max_trainees - len(data),
        'trainees': data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trainer_feedback_received_self(request):
    """Return feedback received by the currently authenticated trainer."""
    user = request.user
    feedbacks = Feedback.objects.filter(session__trainer=user).select_related('session', 'trainee').order_by('-submitted_at')
    total = feedbacks.count()
    avg = round(feedbacks.aggregate(Avg('overall_rating'))['overall_rating__avg'] or 0, 1)
    data = []
    for f in feedbacks:
        data.append({
            'id': f.id,
            'session_title': f.session.title or (f.session.course.title if f.session and f.session.course else '') if f.session else '',
            'trainee_name': f'{f.trainee.first_name} {f.trainee.last_name}'.strip() or f.trainee.username,
            'trainer_rating': f.trainer_rating,
            'content_rating': f.content_rating,
            'venue_rating': f.venue_rating,
            'overall_rating': f.overall_rating,
            'comments': f.comments or '',
            'submitted_at': f.submitted_at.isoformat() if f.submitted_at else None,
        })
    return Response({'total_feedback': total, 'avg_rating': avg, 'received': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trainee_leaderboard(request):
    """Leaderboard of trainees ranked by composite score (quiz avg + attendance + sessions)."""
    trainees = User.objects.filter(role='TRAINEE')
    board = []
    for t in trainees:
        results = QuizResult.objects.filter(trainee=t)
        quiz_avg = round(results.aggregate(Avg('percentage'))['percentage__avg'] or 0, 1)
        att = Attendance.objects.filter(trainee=t)
        att_rate = round((att.filter(status__in=['PRESENT','LATE']).count() / att.count() * 100)) if att.count() > 0 else 0
        sessions_completed = t.enrolled_sessions.filter(status='COMPLETED').count()
        score = round((quiz_avg * 0.4) + (att_rate * 0.4) + (sessions_completed * 2), 1)
        board.append({
            'trainee_id': t.id,
            'name': f'{t.first_name} {t.last_name}'.strip() or t.username,
            'employee_id': t.employee_id or t.username,
            'department': t.department or '—',
            'score': score,
            'quiz_avg': quiz_avg,
            'attendance_rate': att_rate,
            'sessions_completed': sessions_completed,
        })
    board.sort(key=lambda x: x['score'], reverse=True)
    for i, item in enumerate(board):
        item['rank'] = i + 1
    return Response(board)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trainee_certificates_self(request):
    """Return certificates for the currently authenticated trainee."""
    user = request.user
    certs = Certificate.objects.filter(trainee=user).select_related('course', 'session').order_by('-issued_date')
    data = []
    for c in certs:
        data.append({
            'id': c.id,
            'certificate_number': c.certificate_number,
            'issued_date': c.issued_date.isoformat() if c.issued_date else None,
            'is_valid': c.is_valid,
            'course': c.course_id,
            'course_title': c.course.title if c.course else '',
            'session': c.session_id,
            'session_title': c.session.title or (c.session.course.title if c.session and c.session.course else '') if c.session else '',
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_dashboard_self(request):
    """Dashboard for the currently authenticated client user."""
    user = request.user
    site_name = user.managed_site or user.site_location or ''
    trainees = User.objects.filter(role='TRAINEE', site_location=site_name)
    total_trainees = trainees.count()

    all_sessions = Session.objects.filter(trainees__in=trainees).distinct()
    completed_sessions = all_sessions.filter(status='COMPLETED').count()
    total_sessions = all_sessions.count()
    total_certs = Certificate.objects.filter(trainee__in=trainees, is_valid=True).count()

    all_att = Attendance.objects.filter(trainee__in=trainees)
    avg_attendance = round((all_att.filter(status__in=['PRESENT','LATE']).count() / all_att.count() * 100)) if all_att.count() > 0 else 0

    all_results = QuizResult.objects.filter(trainee__in=trainees)
    avg_quiz = round(all_results.aggregate(Avg('percentage'))['percentage__avg'] or 0, 1)

    compliant = trainees.filter(
        attendances__status__in=['PRESENT','LATE'],
        certificates__is_valid=True
    ).distinct().count()
    compliance_rate = round((compliant / total_trainees * 100)) if total_trainees > 0 else 0

    # Department distribution
    dept_count = {}
    for t in trainees.exclude(department=''):
        dept_count[t.department] = dept_count.get(t.department, 0) + 1
    dept_distribution = [{'name': d, 'value': v} for d, v in dept_count.items()]

    # Session status breakdown
    status_count = {}
    for s in all_sessions:
        status_count[s.status] = status_count.get(s.status, 0) + 1
    session_status_breakdown = [{'name': k, 'value': v} for k, v in status_count.items()]

    # Top trainees
    top = []
    for t in trainees:
        att = Attendance.objects.filter(trainee=t)
        att_rate = round((att.filter(status__in=['PRESENT','LATE']).count() / att.count() * 100)) if att.count() > 0 else 0
        results = QuizResult.objects.filter(trainee=t)
        q_avg = round(results.aggregate(Avg('percentage'))['percentage__avg'] or 0, 1)
        top.append({
            'id': t.id,
            'name': f'{t.first_name} {t.last_name}'.strip() or t.username,
            'employee_id': t.employee_id or t.username,
            'department': t.department,
            'attendance_rate': att_rate,
            'sessions_completed': t.enrolled_sessions.filter(status='COMPLETED').count(),
            'quiz_avg': q_avg,
        })
    top.sort(key=lambda x: x['quiz_avg'] + x['attendance_rate'], reverse=True)

    # Monthly trend (simplified)
    now = timezone.now()
    monthly_trend = []
    for i in range(5, -1, -1):
        start = now - timedelta(days=30 * (i + 1))
        end = now - timedelta(days=30 * i)
        enrolled_count = Attendance.objects.filter(trainee__in=trainees, session__start_time__range=(start, end)).values('trainee').distinct().count()
        present_count = Attendance.objects.filter(trainee__in=trainees, session__start_time__range=(start, end), status__in=['PRESENT','LATE']).count()
        total_count = Attendance.objects.filter(trainee__in=trainees, session__start_time__range=(start, end)).count()
        monthly_trend.append({
            'name': end.strftime('%b'),
            'traineesEnrolled': enrolled_count,
            'completionRate': round((present_count / total_count * 100)) if total_count > 0 else 0,
        })

    return Response({
        'site_name': site_name or 'All Sites',
        'total_trainees': total_trainees,
        'total_sessions': total_sessions,
        'completed_sessions': completed_sessions,
        'total_certificates': total_certs,
        'avg_attendance': avg_attendance,
        'avg_quiz_score': avg_quiz,
        'compliance_rate': compliance_rate,
        'dept_distribution': dept_distribution,
        'session_status_breakdown': session_status_breakdown,
        'top_trainees': top[:20],
        'monthly_trend': monthly_trend,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_compliance_self(request):
    """Compliance data for the currently authenticated client."""
    user = request.user
    site_name = user.managed_site or user.site_location or ''
    trainees = User.objects.filter(role='TRAINEE', site_location=site_name)
    total = trainees.count()
    compliant_count = 0
    trainee_list = []

    dept_att = {}
    for t in trainees:
        att = Attendance.objects.filter(trainee=t)
        present = att.filter(status__in=['PRESENT','LATE']).count()
        att_rate = round((present / att.count() * 100)) if att.count() > 0 else 0
        sessions_done = t.enrolled_sessions.filter(status='COMPLETED').count()
        is_compliant = att_rate >= 75 and sessions_done > 0
        if is_compliant:
            compliant_count += 1
        dept = t.department or 'Unknown'
        if dept not in dept_att:
            dept_att[dept] = {'total': 0, 'compliant': 0}
        dept_att[dept]['total'] += 1
        if is_compliant:
            dept_att[dept]['compliant'] += 1
        trainee_list.append({
            'id': t.id,
            'name': f'{t.first_name} {t.last_name}'.strip() or t.username,
            'employee_id': t.employee_id or t.username,
            'department': dept,
            'attendance_rate': att_rate,
            'sessions_completed': sessions_done,
            'is_compliant': is_compliant,
        })

    compliance_rate = round((compliant_count / total * 100)) if total > 0 else 0
    department_compliance = [
        {'name': d, 'value': round(v['compliant'] / v['total'] * 100) if v['total'] > 0 else 0}
        for d, v in dept_att.items()
    ]

    all_att = Attendance.objects.filter(trainee__in=trainees)
    avg_att = round((all_att.filter(status__in=['PRESENT','LATE']).count() / all_att.count() * 100)) if all_att.count() > 0 else 0
    all_sess = Session.objects.filter(trainees__in=trainees).distinct()

    return Response({
        'site_name': site_name or 'All Sites',
        'total_trainees': total,
        'compliant_trainees': compliant_count,
        'non_compliant_trainees': total - compliant_count,
        'compliance_rate': compliance_rate,
        'avg_attendance': avg_att,
        'completed_sessions': all_sess.filter(status='COMPLETED').count(),
        'total_sessions': all_sess.count(),
        'pending_trainings': all_sess.filter(status='SCHEDULED').count(),
        'department_compliance': department_compliance,
        'trainee_list': trainee_list,
    })


# ── TRAINEE SESSION PROGRESS ──────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def trainee_session_progress(request, session_id):
    """
    GET  - return current progress for this trainee+session
    POST - update progress { progress: 'BEGIN'|'MID'|'COMPLETED' }
    When progress transitions to BEGIN, auto-mark attendance as PRESENT.
    """
    user = request.user
    try:
        session = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)

    if request.method == 'GET':
        try:
            prog = TraineeSessionProgress.objects.get(trainee=user, session=session)
            return Response(TraineeSessionProgressSerializer(prog).data)
        except TraineeSessionProgress.DoesNotExist:
            return Response({'progress': 'NOT_STARTED', 'session': session_id, 'trainee': user.id})

    # POST
    new_progress = request.data.get('progress', '').upper()
    valid = ['NOT_STARTED', 'BEGIN', 'MID', 'COMPLETED']
    if new_progress not in valid:
        return Response({'error': f'progress must be one of {valid}'}, status=400)

    try:
        prog, created = TraineeSessionProgress.objects.get_or_create(
            trainee=user, session=session,
            defaults={'progress': 'NOT_STARTED'}
        )
    except Exception as e:
        import traceback; traceback.print_exc()
        return Response(
            {'error': 'Progress table not ready. Please run: python manage.py migrate', 'detail': str(e)},
            status=500
        )

    now = timezone.now()
    if new_progress == 'BEGIN' and prog.progress == 'NOT_STARTED':
        prog.started_at = now
        # Auto-mark attendance as PRESENT
        try:
            Attendance.objects.update_or_create(
                session=session, trainee=user,
                defaults={'status': 'PRESENT', 'check_in_time': now, 'join_time': now}
            )
        except Exception as att_err:
            import traceback
            traceback.print_exc()
            # Don't block progress update if attendance write fails
    if new_progress == 'COMPLETED' and not prog.completed_at:
        prog.completed_at = now

    try:
        prog.progress = new_progress
        prog.save()
    except Exception as save_err:
        import traceback
        traceback.print_exc()
        return Response({'error': str(save_err)}, status=500)

    return Response(TraineeSessionProgressSerializer(prog).data)


# ── TRAINEE UPCOMING SESSIONS (self-auth) ─────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trainee_upcoming_sessions_self(request):
    """Upcoming and enrolled sessions for the current trainee, with progress."""
    user = request.user
    now = timezone.now()
    sessions_qs = Session.objects.filter(
        trainees=user,
    ).exclude(status='CANCELLED').select_related('course', 'trainer', 'site_location').order_by('start_time')

    data = []
    for s in sessions_qs:
        try:
            prog = TraineeSessionProgress.objects.get(trainee=user, session=s)
            progress = prog.progress
        except TraineeSessionProgress.DoesNotExist:
            progress = 'NOT_STARTED'

        data.append({
            'id': s.id,
            'title': s.title or s.course.title,
            'course_title': s.course.title if s.course else '',
            'start_time': s.start_time.isoformat(),
            'end_time': s.end_time.isoformat(),
            'status': s.status,
            'session_type': s.session_type,
            'meeting_link': s.meeting_link,
            'location': s.site_location.name if s.site_location else (s.location or 'Online'),
            'trainer_name': (f"{s.trainer.first_name} {s.trainer.last_name}".strip() or s.trainer.username) if s.trainer else '',
            'progress': progress,
            'is_past': s.start_time < now,
        })
    return Response(data)


# ── TRAINEE FEEDBACK SUBMIT (self-auth) ───────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trainee_submit_feedback(request, session_id):
    """Submit extended feedback for a session."""
    user = request.user
    try:
        session = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)

    if Feedback.objects.filter(session=session, trainee=user).exists():
        return Response({'error': 'Feedback already submitted'}, status=400)

    d = request.data
    feedback = Feedback.objects.create(
        session=session,
        trainee=user,
        trainer_rating=d.get('trainer_rating', 5),
        content_rating=d.get('content_rating', 5),
        venue_rating=d.get('venue_rating', 5),
        overall_rating=d.get('overall_rating', 5),
        comments=d.get('comments', ''),
        trainer_knowledge_rating=d.get('trainer_knowledge_rating'),
        trainer_communication_rating=d.get('trainer_communication_rating'),
        trainer_engagement_rating=d.get('trainer_engagement_rating'),
        content_relevance_rating=d.get('content_relevance_rating'),
        content_clarity_rating=d.get('content_clarity_rating'),
        would_recommend=d.get('would_recommend'),
        best_part=d.get('best_part', ''),
        improvement_suggestion=d.get('improvement_suggestion', ''),
        submitted_at=timezone.now(),
        created_at=timezone.now(),
    )
    return Response({'id': feedback.id, 'message': 'Feedback submitted'}, status=201)


# ── QUESTION BANK ─────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def question_bank_list(request):
    """List / create questions in the question bank."""
    if request.method == 'GET':
        course_id = request.query_params.get('course_id')
        qs = QuestionBank.objects.select_related('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
        hide = request.user.role == 'TRAINEE'
        serializer = QuestionBankSerializer(qs, many=True, context={'hide_answer': hide})
        return Response(serializer.data)

    # POST - trainer/admin only
    if request.user.role not in ('TRAINER', 'ADMIN'):
        return Response({'error': 'Permission denied'}, status=403)
    data = request.data.copy()
    data['created_by'] = request.user.id
    serializer = QuestionBankSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def question_bank_detail(request, pk):
    """Retrieve / update / delete a single question."""
    try:
        question = QuestionBank.objects.get(pk=pk)
    except QuestionBank.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if request.method == 'GET':
        hide = request.user.role == 'TRAINEE'
        return Response(QuestionBankSerializer(question, context={'hide_answer': hide}).data)

    if request.user.role not in ('TRAINER', 'ADMIN'):
        return Response({'error': 'Permission denied'}, status=403)

    if request.method == 'PUT':
        serializer = QuestionBankSerializer(question, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    # DELETE
    question.delete()
    return Response(status=204)


# ── SESSION QUIZ (questions only from QuestionBank) ───────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_quiz_questions(request, session_id):
    """Return quiz questions for a session's course (hides answers for trainees)."""
    try:
        session = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)
    questions = QuestionBank.objects.filter(course=session.course)
    hide = request.user.role == 'TRAINEE'
    serializer = QuestionBankSerializer(questions, many=True, context={'hide_answer': hide})
    return Response(serializer.data)


# ── TRAINER SESSIONS WITH QR base64 ──────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trainer_sessions_full(request):
    """
    Sessions for current trainer including QR base64, enrollment link,
    trainee count, and site/location details.
    """
    user = request.user
    sessions_qs = Session.objects.filter(trainer=user).select_related(
        'course', 'site_location'
    ).prefetch_related('trainees').order_by('-start_time')

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    data = []
    for s in sessions_qs:
        # Ensure enrollment link & qr_image_base64 are set
        if not s.enrollment_link:
            s.enrollment_link = f"{frontend_url}/enroll/{s.qr_token}/"
            s.save(update_fields=['enrollment_link'])

        data.append({
            'id': s.id,
            'title': s.title or s.course.title,
            'course_title': s.course.title if s.course else '',
            'course_id': s.course_id,
            'start_time': s.start_time.isoformat(),
            'end_time': s.end_time.isoformat(),
            'status': s.status,
            'session_type': s.session_type,
            'meeting_link': s.meeting_link,
            'location': s.site_location.name if s.site_location else (s.location or 'Online'),
            'trainees_count': s.trainees.count(),
            'max_trainees': s.max_trainees,
            'enrollment_link': s.enrollment_link,
            'qr_image_base64': s.qr_image_base64,
            'qr_token': str(s.qr_token),
        })
    return Response(data)


# ── TRAINER LEADERBOARD (trainer_id only, no names) ──────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trainer_leaderboard(request):
    """
    Leaderboard of trainers by composite score.
    Returns trainer_id only (no names) to preserve anonymity.
    The requesting trainer gets is_current=True on their entry.
    """
    current_user = request.user
    trainers = User.objects.filter(role='TRAINER')
    board = []
    for t in trainers:
        ts = Session.objects.filter(trainer=t)
        sessions_count = ts.count()
        completed = ts.filter(status='COMPLETED').count()
        fb = Feedback.objects.filter(session__trainer=t)
        avg_rating = round(fb.aggregate(Avg('overall_rating'))['overall_rating__avg'] or 0, 1)
        trainees_count = User.objects.filter(enrolled_sessions__trainer=t).distinct().count()
        completion_rate = round((completed / sessions_count * 100)) if sessions_count > 0 else 0
        score = round((avg_rating * 20 * 0.4) + (completion_rate * 0.4) + (min(trainees_count, 50) * 0.2 * 2), 1)
        board.append({
            'trainer_id': t.employee_id or f'EMP-{t.id:04d}',
            'is_current': t.id == current_user.id,
            'score': score,
            'sessions_count': sessions_count,
            'completion_rate': completion_rate,
            'avg_rating': avg_rating,
            'trainees_count': trainees_count,
            # Radar breakdown
            'breakdown': {
                'sessions': min(sessions_count * 5, 100),
                'completion': completion_rate,
                'rating': round(avg_rating * 20),
                'trainees': min(trainees_count * 2, 100),
                'feedback': min(fb.count() * 5, 100),
            }
        })
    board.sort(key=lambda x: x['score'], reverse=True)
    for i, item in enumerate(board):
        item['rank'] = i + 1
    return Response(board)
