# AI Recruitment Portal

AI Recruitment Portal is a full-stack recruitment workspace for managing jobs, candidate resumes, semantic matching, candidate progress, and AI-generated interview preparation.

The application has:

- A React and Vite frontend.
- A FastAPI backend.
- Aiven PostgreSQL for users and recruitment data.
- bcrypt password hashing and JWT authentication.
- Employee registration with administrator approval.
- Role-based access for administrators and employees.
- Per-employee data isolation.
- Resume parsing and embedding-based candidate matching.
- Groq-powered interview kit generation.

## Features

### Authentication and approval

- Employees register with name, email, and password.
- New accounts start as `PENDING`.
- Pending users cannot access protected APIs or application pages.
- Administrators can approve or reject registrations.
- Rejected users cannot log in.
- Approved employees can use the recruitment workspace.
- Passwords are stored only as bcrypt hashes.
- JWT tokens are sent using the `Authorization: Bearer <token>` header.
- Login state survives browser refresh through the stored access token.

### Administrator controls

Administrators can:

- View all users.
- Review pending registrations.
- Approve or reject employees.
- Add approved employee accounts.
- Remove employee accounts.
- View all recruitment records.

### Recruitment workflow

Employees can:

- Create jobs from text or files.
- Upload PDF resumes.
- Extract candidate name, email, skills, experience, and summary.
- Match candidates against jobs.
- Review candidate match scores.
- Update candidate progress status.
- Generate AI interview kits.

Each job, resume, match, and dashboard record is scoped to its employee owner. Administrators can view all records.

## Project structure

```text
AI-Recruitment-Portal/
├── Backend/
│   ├── database.py       PostgreSQL connection and schema creation
│   ├── main.py           FastAPI routes, auth, approval, and admin APIs
│   ├── embeddings.py     Resume and job embeddings
│   ├── job.py            Job creation and analysis
│   ├── matching.py       Candidate matching
│   ├── resume.py         Resume parsing and storage
│   ├── pdf_parser.py     PDF text extraction
│   └── llm.py            Groq AI integration
├── frontend/
│   ├── src/
│   │   ├── components/   Shared UI and protected layout
│   │   ├── context/      Frontend authentication state
│   │   ├── pages/        Login, registration, dashboards, admin view
│   │   └── services/     API and authentication clients
│   │   └── App.tsx       Frontend routes
│   ├── package.json
│   └── vite.config.ts
├── render.yaml           Render backend and frontend blueprint
├── requirements.txt
├── .env.example
└── .gitignore
```

## Requirements

- Python 3.10 or newer.
- Node.js 18 or newer.
- An Aiven PostgreSQL service.
- A Groq API key for AI features.
- Optional SMTP credentials for registration notifications.

## Local setup

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd AI-Recruitment-Portal
```

### 2. Create the Python environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure the backend

Copy the template:

```powershell
Copy-Item .env.example .env
```

Then edit `.env`:

```env
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-20b
DATABASE_URL=postgresql://username:password@your-aiven-host:port/database?sslmode=require
JWT_SECRET=use_a-long-random-secret
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_NAME=Administrator
ADMIN_PASSWORD=use-a-secure-password
```

Never commit `.env`.

### 5. Install the frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
cd ..
```

Set the frontend API URL in `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

Only public frontend configuration belongs in `frontend/.env`. Do not put `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`, SMTP passwords, or Groq secrets there.

## Running locally

Start the backend from the repository root:

```powershell
.\.venv\Scripts\python.exe -m uvicorn Backend.main:app --reload
```

Start the frontend in another terminal:

```powershell
cd frontend
npm run dev
```

Open:

- Frontend: http://localhost:5173
- API: http://127.0.0.1:8000
- API docs: http://127.0.0.1:8000/docs

Using `python -m uvicorn` through the virtual environment avoids the Windows error where PowerShell cannot find the `uvicorn` command.

## Authentication workflow

### Employee

1. Open `/register`.
2. Submit name, email, and password.
3. The backend stores a bcrypt password hash and creates a `PENDING` user.
4. The admin receives an optional email notification.
5. The employee waits for approval.
6. After approval, the employee can log in.

### Administrator

The first administrator is created automatically at backend startup from:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_NAME=Administrator
ADMIN_PASSWORD=your-secure-password
```

The administrator opens `/admin` to manage registrations and employee accounts.

## API overview

### Public authentication

```text
POST /auth/register
POST /auth/login
```

### Authenticated user

```text
GET /auth/me
GET /dashboard
GET /candidates
GET /jobs
POST /resumes/upload
POST /jobs
GET /matching/{job_id}
```

### Administrator-only

```text
GET    /admin/users
POST   /admin/users
POST   /admin/users/{id}/approve
POST   /admin/users/{id}/reject
DELETE /admin/users/{id}
```

The backend returns:

- `401` for missing or invalid authentication.
- `403` for pending, rejected, or non-admin access.
- `409` for duplicate email registration.
- `422` for invalid input.

## Database

The backend creates these PostgreSQL tables on startup:

- `users`
- `candidates`
- `jobs`
- `candidate_matches`
- `interview_questions`

Jobs and candidates contain an `owner_id` linked to `users.id`. Employees only query their own records. Administrators can query all records.

Existing rows created before ownership was added may have a null `owner_id`; those rows are intentionally available only to administrators until they are reassigned.

## Render deployment

The repository includes [render.yaml](render.yaml), which defines:

- A Python web service for FastAPI.
- A static site for the Vite frontend.
- The PostgreSQL, JWT, AI, admin, SMTP, and CORS environment variables.

### Deploy with Render Blueprint

1. Push this repository to GitHub.
2. Sign in to Render.
3. Select **New +** and choose **Blueprint**.
4. Connect the GitHub repository.
5. Render detects `render.yaml`.
6. Create the two services.
7. Set the secret `sync: false` values in the Render dashboard.
8. After the backend deploys, copy its public URL, for example:

```text
https://ai-recruitment-api.onrender.com
```

9. Set the frontend service variable:

```text
VITE_API_URL=https://ai-recruitment-api.onrender.com
```

10. Set the backend variables:

```text
FRONTEND_URL=https://your-frontend.onrender.com
FRONTEND_ORIGINS=https://your-frontend.onrender.com
```

11. Redeploy the frontend after setting `VITE_API_URL`.

### Render environment variables

Backend required:

```text
DATABASE_URL
JWT_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
FRONTEND_ORIGINS
FRONTEND_URL
GROQ_API_KEY
GROQ_MODEL
```

Backend optional:

```text
ADMIN_NAME
SMTP_HOST
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD
```

Frontend required:

```text
VITE_API_URL
```

Do not commit any real values to `render.yaml`; it contains only placeholders and `sync: false` declarations.

## GitHub publishing

Before pushing:

```powershell
git status
git diff --check
git add .
git diff --cached --stat
git commit -m "Prepare recruitment portal for deployment"
git push -u origin main
```

The `.gitignore` excludes:

- `.env` files and secrets.
- Python virtual environments.
- Node dependencies.
- Vite build output.
- Local database dumps and database artifacts.
- Uploaded resumes.
- Python caches.
- Bundled Node archives.
- Render-local files.

`render.yaml` is intentionally **not** ignored because Render needs it in the GitHub repository to create the services.

## Security checklist

- Rotate any credential that was ever stored in a tracked or shared file.
- Keep `.env` local and private.
- Use a long random `JWT_SECRET`.
- Use a strong `ADMIN_PASSWORD`.
- Never put backend secrets in `frontend/.env`.
- Keep Aiven TLS enabled with `sslmode=require`.
- Restrict `FRONTEND_ORIGINS` to the real frontend domain in production.
- Do not commit uploaded resumes or database dumps.
- Review Render logs for failed database connections after deployment.

## Validation commands

Backend syntax check:

```powershell
.\.venv\Scripts\python.exe -m py_compile Backend\database.py Backend\main.py Backend\job.py Backend\resume.py Backend\matching.py
```

Frontend production build:

```powershell
cd frontend
npm run build
```

Frontend lint:

```powershell
npm run lint
```

## License and project status

This is a local-development recruitment portal prepared for deployment. Add a license, privacy policy, and production data-retention policy before using it with real candidate information.
