
from django.contrib import admin
from .models import User, Course, Session, Attendance, Quiz, Feedback

admin.site.register(User)
admin.site.register(Course)
admin.site.register(Session)
admin.site.register(Attendance)
admin.site.register(Quiz)
admin.site.register(Feedback)

