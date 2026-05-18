Reporting Analytics and Stakeholder Feedback

# Eagle Industry Training Platform

A full-stack corporate training management system built with **Django REST Framework** (backend) and **React + TypeScript + Vite** (frontend). The platform supports four distinct user roles — Admin, Trainer, Trainee, and Client — each with a dedicated dashboard and workflow.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running the App](#running-the-app)
- [User Roles & Pages](#user-roles--pages)
- [Key Features](#key-features)
- [API Overview](#api-overview)
- [Environment Notes](#environment-notes)

---

## Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Python | 3.10+ | Runtime |
| Django | 5.2.14 | Web framework |
| djangorestframework | 3.17.1 | REST API |
| djangorestframework-simplejwt | 5.5.1 | JWT authentication |
| django-cors-headers | 4.9.0 | CORS for React dev server |
| django-filter | 25.2 | Query filtering |
| qrcode + Pillow | 8.2 / 12.1.1 | QR code generation |
| reportlab | 4.4.10 | Certificate PDF generation |
| SQLite | built-in | Database (dev) |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 8.0.13 | Build tool & dev server |
| React Router DOM | 6.30.1 | Client-side routing |
| Tailwind CSS | 3.4.17 | Utility-first styling |
| shadcn/ui + Radix UI | latest | Component library |
| Recharts | 2.15.4 | Charts & data visualisation |
| React Hook Form | 7.61.1 | Forms & validation |
| jsPDF + html2canvas | latest | PDF export |
| TanStack Query | 5.83.0 | Server state management |
| Framer Motion | 12.35.0 | Animations |

---

## Project Structure

```
Eagle_Industry_Project/
├── requirements.txt                   # Python dependencies
├── backend/                           # Django project
│   ├── manage.py
│   ├── db.sqlite3                     # SQLite database (dev)
│   ├── config/                        # Django settings & URLs
│   │   ├── settings.py
│   │   └── urls.py
│   └── api/                           # Main Django app
│       ├── models.py                  # All data models
│       ├── serializers.py             # DRF serializers
│       ├── views.py                   # All API views & endpoints
│       ├── urls.py                    # API URL routing
│       ├── admin.py                   # Django admin config
│       └── migrations/                # Database migrations
└── main/                               # React frontend
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── src/
        ├── main.tsx                   # Entry point
        ├── App.tsx                    # Routes & role guards
        ├── api/
        │   └── axios.ts               # Axios instance + JWT interceptor
        ├── contexts/
        │   └── AuthContext.tsx        # Auth state & JWT management
        ├── components/
        │   ├── ui/                    # shadcn/ui components
        │   └── AppLayout.tsx          # Sidebar + role-based navigation
        ├── pages/                     # One file per route/page
        └── lib/
            └── routeGuards.tsx        # Role-based route protection
```

---

## Prerequisites

- **Python 3.10+** — [python.org](https://www.python.org/downloads/)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)

---

## Getting Started

### Backend Setup

```powershell
# 1. Navigate to the backend folder
cd Eagle_Industry_Project\backend

# 2. (Recommended) Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Install Python dependencies
pip install -r ..\requirements.txt

# 4. Apply database migrations
python manage.py migrate

# 5. (Optional) Seed the database with sample data
python manage.py seed_data

# 6. Create a superuser for Django admin
python manage.py createsuperuser
```

### Frontend Setup

```powershell
# Navigate to the frontend folder
cd Eagle_Industry_Project\main

# Install Node dependencies
npm install
```

---

## Running the App

Open **two separate PowerShell terminals** in VS Code (`Ctrl+`` then the + icon):

**Terminal 1 — Django backend:**
```powershell
cd Eagle_Industry_Project\backend
.\venv\Scripts\Activate.ps1    # activate venv if you created one
python manage.py runserver
# Runs at http://localhost:8000
```

**Terminal 2 — React frontend:**
```powershell
cd Eagle_Industry_Project\main
npm run dev
# Runs at http://localhost:8080
```

Open your browser at **http://localhost:8080**.

> Both terminals must stay running at the same time.

---

## User Roles & Pages

### Admin (`/admin/...`)
| Route | Page | Description |
|---|---|---|
| `/admin/dashboard` | AdminDashboard | KPI cards, charts, recent sessions, gap analysis |
| `/admin/training` | AdminTrainingManagement | Create/edit sessions, manage trainees |
| `/admin/analytics` | AdminAnalytics | Full analytics with PDF export |
| `/admin/feedback` | AdminFeedback | View all feedback submissions |
| `/admin/compliance` | MapScreen | Site compliance map view |

### Trainer (`/trainer/...`)
| Route | Page | Description |
|---|---|---|
| `/trainer/dashboard` | TrainerDashboard | Performance index, trainee trends, next sessions |
| `/trainer/training` | TrainerTrainingManagement | Sessions list, QR code modal, trainee management |
| `/trainer/quiz-builder` | TrainerQuizBuilder | Build quizzes, import from question bank |
| `/trainer/schedule` | TrainerSchedule | Weekly calendar view of sessions |
| `/trainer/feedback` | TrainerFeedback | Feedback received from trainees |
| `/trainer/leaderboard` | TrainerLeaderboard | Trainee performance rankings |

### Trainee (`/trainee/...`)
| Route | Page | Description |
|---|---|---|
| `/trainee/dashboard` | TraineeDashboard | Progress overview, upcoming sessions, scores |
| `/trainee/report-card` | TraineeReportCard | Detailed assessment results |
| `/trainee/sessions/upcoming` | TraineeUpcomingSessions | Upcoming scheduled sessions |
| `/trainee/sessions/available` | TraineeAvailableSessions | Browse & enroll in open sessions |
| `/trainee/sessions/completed` | TraineeCompletedSessions | History of completed sessions |
| `/trainee/attendance` | TraineeAttendance | Attendance record |
| `/trainee/feedback` | TraineeFeedback | Submit session feedback |
| `/trainee/certificates` | TraineeCertificates | Download completion certificates (PDF) |

### Client (`/client/...`)
| Route | Page | Description |
|---|---|---|
| `/client/dashboard` | ClientDashboard | Organisation-level training overview |
| `/client/compliance` | ClientCompliance | Compliance report with PDF export |

### Public Routes
| Route | Description |
|---|---|
| `/login` | Login with Employee ID + Password |
| `/enroll/:qr_token` | QR code-based session self-enrollment |
| `/unauthorized` | Access denied page |

---

## Key Features

- **JWT Authentication** — Login with `employee_id`. Tokens auto-refresh via Axios interceptor. All API calls carry `Authorization: Bearer <token>` automatically.
- **Role-Based Access Control** — Routes are protected by role guards. Unauthenticated or wrong-role access redirects to `/unauthorized`.
- **QR Code Enrollment** — Trainers generate a QR code per session. Trainees scan it to self-enroll via `/enroll/:qr_token` without needing to log in first.
- **Quiz & Question Bank** — Trainers build quizzes from a reusable question bank (MCQ, True/False, Short Answer). Questions can be saved to the bank for reuse across courses.
- **Session Progress Tracking** — Trainee progress per session tracked in four stages: `NOT_STARTED → BEGIN → MID → COMPLETED`.
- **Certificate Generation** — ReportLab generates PDF certificates for completed training. Downloadable from the Certificates page.
- **Reporting Analytics and Stakeholder Feedback** — Admin analytics dashboard with jsPDF + html2canvas export. Client compliance report with PDF download.
- **Trainer Leaderboard** — Ranked trainee performance table with scoring metrics.
- **Extended Feedback** — 7-dimension rating system covering Content Quality, Trainer Effectiveness, Pacing, Relevance, Materials, Venue/Tech, and Overall.

---

## API Overview

All endpoints are prefixed with `http://localhost:8000/api/`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/token/` | Login — returns JWT access + refresh tokens |
| POST | `/api/token/refresh/` | Refresh JWT access token |
| GET | `/api/admin-dashboard/` | Admin KPIs, charts, gap analysis |
| GET/POST | `/api/sessions/` | List / create sessions |
| GET | `/api/trainer/sessions/full/` | Trainer's own sessions (self-auth from JWT) |
| GET | `/api/trainer/{id}/dashboard/` | Trainer dashboard metrics |
| GET | `/api/trainee/{id}/dashboard/` | Trainee dashboard metrics |
| GET | `/api/trainee/{id}/attendance/` | Trainee attendance records |
| GET | `/api/trainee/{id}/completed/` | Completed sessions |
| GET | `/api/trainee/{id}/report-card/` | Assessment scores |
| GET/POST | `/api/question-bank/` | List / create question bank entries |
| GET | `/api/courses/` | List all courses |
| GET | `/api/users/` | List users (filterable by `?role=TRAINEE`) |
| GET | `/api/enroll/{qr_token}/` | Get session info by QR token |
| POST | `/api/enroll/{qr_token}/` | Self-enroll via QR token |
| GET | `/api/certificates/` | List certificates for the logged-in trainee |
| GET | `/api/client/dashboard/` | Client org-level dashboard |
| GET | `/api/client/compliance/` | Client compliance data |

---

## Environment Notes

- **Database**: SQLite (`backend/db.sqlite3`) is used for development. For production, switch to PostgreSQL by updating `DATABASES` in `config/settings.py`.
- **Media files**: QR code images are stored in `backend/media/qrcodes/`. Ensure `MEDIA_ROOT` is writable.
- **CORS**: Configured to allow `http://localhost:8080` (Vite dev server). Update `CORS_ALLOWED_ORIGINS` in settings for any other origin.
- **Secret Key**: The `SECRET_KEY` in `settings.py` should be moved to an environment variable before deploying to production.
- **Debug mode**: `DEBUG=True` in `settings.py` — always set to `False` for production.
- **Version control**: The root `.gitignore` excludes local artifacts like `db.sqlite3`, `backend/media/`, virtualenvs, `.env` files, and `node_modules`. If any of these were already tracked, remove them from git before pushing.

---

## Django Admin

Access the Django admin panel at **http://localhost:8000/admin/** using your superuser credentials. All models (Users, Sessions, Courses, Quizzes, Certificates, etc.) are fully manageable from the admin panel.

---

## Group 49

- **Team Lead**: Piyush Mishra IT
- **Team Members**: Krish More, Niharika Muneshwar, Krish Mhashakheri, Kiran Naaz
