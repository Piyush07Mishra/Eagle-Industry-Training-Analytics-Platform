# Deployment learnings

This note captures the mistakes made during deployment and a repeatable, step-by-step checklist for Vercel (frontend), Render (backend), and Render Postgres, including connectivity validation.

## Mistakes made (and how to avoid them)

1. Hardcoded localhost in frontend
   - Problem: API calls still used http://localhost:8000 after deploying.
   - Fix: Read the API base URL from Vercel env var (VITE_API_BASE_URL) and remove any fallback to localhost.

2. Missing environment variables in production
   - Problem: Backend failed because SECRET_KEY, DATABASE_URL, and ALLOWED_HOSTS were not set in Render.
   - Fix: Add required environment variables in Render before first deploy.

3. Wrong ALLOWED_HOSTS format
   - Problem: Used frontend domain or included https:// in ALLOWED_HOSTS, causing 400 Bad Request on every request.
   - Fix: ALLOWED_HOSTS must be backend hostnames only (no scheme, no path).

4. CORS and CSRF misconfiguration
   - Problem: Login failed due to blocked cross-origin requests.
   - Fix: Add Vercel domain to CORS_ALLOWED_ORIGINS and CSRF_TRUSTED_ORIGINS. Add regex for preview domains if needed.

5. Database not migrated on production
   - Problem: Login returned 400 because the new Postgres DB had no tables/users.
   - Fix: Run migrate and seed_data against the Render Postgres DB.

6. Missing backend dependencies locally
   - Problem: Running manage.py failed due to missing dj-database-url or psycopg.
   - Fix: Always install requirements.txt locally before running migrations.

7. Using external DB URL locally without SSL handling
   - Problem: sqlite errors when django tried to use sslmode with sqlite.
   - Fix: Ensure DATABASE_URL points to Postgres when running migrations against production.

8. Credentials pasted in chat
   - Problem: Exposed database password.
   - Fix: Rotate database password immediately if it is ever exposed. Avoid posting secrets anywhere.

9. Confusing internal vs external DB URL
   - Problem: Used external URL inside Render or wrong URL locally.
   - Fix: Use Internal URL for Render-to-DB, External URL for local access.

## Vercel deployment (frontend)

1. Set env vars in Vercel
   - VITE_API_BASE_URL = https://<your-render-backend>.onrender.com

2. Build settings
   - Framework: Vite
   - Root directory: main
   - Build command: npm run build (or pnpm run build)
   - Output directory: dist

3. Deploy
   - Connect GitHub repo
   - Trigger deployment

4. Validate
   - Open Vercel URL and check the login page loads.
   - Network tab should show POST to https://<render>/api/token/.

## Render deployment (backend)

1. Create Web Service
   - Root directory: backend
   - Build command: pip install -r ../requirements.txt
   - Start command: gunicorn config.wsgi:application

2. Required env vars (Render Web Service)
   - SECRET_KEY = <your secret>
   - DEBUG = False
   - ALLOWED_HOSTS = <your-render-backend>.onrender.com
   - DATABASE_URL = <Render Internal DB URL>
   - CORS_ALLOWED_ORIGINS = https://<your-vercel-app>.vercel.app
   - CSRF_TRUSTED_ORIGINS = https://<your-vercel-app>.vercel.app

3. Deploy and check logs
   - Ensure build succeeds and service starts.

4. Validate
   - https://<render-backend>.onrender.com should return a response (not 400).

## Render Postgres (database)

1. Create PostgreSQL in Render
   - Use same region as backend.

2. Copy URLs
   - Internal Database URL: use in Render Web Service
   - External Database URL: use for local migration

3. Run migrations locally
   - Install dependencies
     - pip install -r requirements.txt
   - Set env var to External DB URL
     - PowerShell: $env:DATABASE_URL = "<External DB URL>"
   - Run migrations
     - cd backend
     - python manage.py migrate
   - Seed data
     - python manage.py seed_data

4. Validate DB data
   - Try login with seeded accounts (admin01 / Password@123).

## Connectivity checklist (quick verification)

- Backend host allowed: ALLOWED_HOSTS contains only backend hostname.
- CORS allowed: Vercel domain in CORS_ALLOWED_ORIGINS.
- CSRF trusted: Vercel domain in CSRF_TRUSTED_ORIGINS.
- Frontend API base: VITE_API_BASE_URL points to Render backend.
- DB migrated: tables exist and seeded users are present.
- Login works: /api/token/ returns 200 and tokens.

## Optional enhancements

- Add a health check endpoint to backend (/health).
- Add a Postgres connection test command.
- Create a separate staging environment.
