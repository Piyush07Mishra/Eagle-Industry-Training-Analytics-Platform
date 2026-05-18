from rest_framework import serializers
from .models import (
    User, SiteLocation, Course, Session, Attendance,
    Quiz, QuizResult, Feedback, TrainerFeedback, Certificate,
    TraineeSessionProgress, QuestionBank,
)


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    site_assignment_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'phone_number',
            'first_name', 'last_name', 'password',
            'employee_id', 'department', 'designation',
            'site_location', 'managed_site', 'site_assignment', 'site_assignment_name',
        ]

    def get_site_assignment_name(self, obj):
        if obj.site_assignment:
            return obj.site_assignment.name
        return None

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class SiteLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteLocation
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'


class SessionSerializer(serializers.ModelSerializer):
    trainer_name = serializers.SerializerMethodField(read_only=True)
    course_title = serializers.SerializerMethodField(read_only=True)
    enrolled_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Session
        fields = '__all__'

    def get_trainer_name(self, obj):
        if obj.trainer:
            return f"{obj.trainer.first_name} {obj.trainer.last_name}".strip() or obj.trainer.username
        return None

    def get_course_title(self, obj):
        return obj.course.title if obj.course else None

    def get_enrolled_count(self, obj):
        return obj.trainees.count()


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = '__all__'


class QuizResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizResult
        fields = '__all__'


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = '__all__'


class TrainerFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainerFeedback
        fields = '__all__'


class CertificateSerializer(serializers.ModelSerializer):
    course_title = serializers.SerializerMethodField(read_only=True)
    session_title = serializers.SerializerMethodField(read_only=True)
    trainee_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Certificate
        fields = '__all__'

    def get_course_title(self, obj):
        return obj.course.title if obj.course else None

    def get_session_title(self, obj):
        return obj.session.title or obj.session.course.title if obj.session else None

    def get_trainee_name(self, obj):
        if obj.trainee:
            return f"{obj.trainee.first_name} {obj.trainee.last_name}".strip() or obj.trainee.username
        return None


class TraineeSessionProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = TraineeSessionProgress
        fields = '__all__'


class QuestionBankSerializer(serializers.ModelSerializer):
    """
    Hides correct_answer for non-trainer requests.
    Pass context={'hide_answer': True} when serving to trainees.
    """
    class Meta:
        model = QuestionBank
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self.context.get('hide_answer'):
            data.pop('correct_answer', None)
            data.pop('explanation', None)
        return data
