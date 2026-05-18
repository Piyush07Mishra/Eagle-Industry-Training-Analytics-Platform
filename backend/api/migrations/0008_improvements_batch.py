from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_alter_quizresult_unique_together_attendance_notes_and_more'),
    ]

    operations = [
        # Add site_assignment FK to User
        migrations.AddField(
            model_name='user',
            name='site_assignment',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='assigned_users',
                to='api.sitelocation',
            ),
        ),

        # Add qr_image_base64 to Session
        migrations.AddField(
            model_name='session',
            name='qr_image_base64',
            field=models.TextField(blank=True, default=''),
            preserve_default=False,
        ),

        # Add completion_type to Certificate
        migrations.AddField(
            model_name='certificate',
            name='completion_type',
            field=models.CharField(
                choices=[('OFFLINE', 'Offline Session'), ('ONLINE', 'Online Module')],
                default='OFFLINE',
                max_length=20,
            ),
        ),

        # Extend Feedback with new rating fields
        migrations.AddField(
            model_name='feedback',
            name='trainer_knowledge_rating',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='trainer_communication_rating',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='trainer_engagement_rating',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='content_relevance_rating',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='content_clarity_rating',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='would_recommend',
            field=models.BooleanField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='best_part',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='improvement_suggestion',
            field=models.TextField(blank=True, null=True),
        ),

        # New model: TraineeSessionProgress
        migrations.CreateModel(
            name='TraineeSessionProgress',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('progress', models.CharField(
                    choices=[
                        ('NOT_STARTED', 'Not Started'),
                        ('BEGIN', 'Begun'),
                        ('MID', 'Mid-way'),
                        ('COMPLETED', 'Completed'),
                    ],
                    default='NOT_STARTED',
                    max_length=15,
                )),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('trainee', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='session_progress',
                    to='api.user',
                )),
                ('session', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='trainee_progress',
                    to='api.session',
                )),
            ],
            options={
                'unique_together': {('trainee', 'session')},
            },
        ),

        # New model: QuestionBank
        migrations.CreateModel(
            name='QuestionBank',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('question_text', models.TextField()),
                ('question_type', models.CharField(
                    choices=[
                        ('MCQ', 'Multiple Choice'),
                        ('TRUE_FALSE', 'True/False'),
                        ('SHORT', 'Short Answer'),
                    ],
                    default='MCQ',
                    max_length=15,
                )),
                ('options', models.JSONField(blank=True, default=list)),
                ('correct_answer', models.CharField(max_length=500)),
                ('explanation', models.TextField(blank=True)),
                ('difficulty', models.CharField(
                    choices=[('EASY', 'Easy'), ('MEDIUM', 'Medium'), ('HARD', 'Hard')],
                    default='MEDIUM',
                    max_length=10,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('course', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='question_bank',
                    to='api.course',
                )),
                ('created_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to='api.user',
                )),
            ],
        ),
    ]
