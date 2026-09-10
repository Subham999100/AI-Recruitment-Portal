# AI Recruitment Portal

AI Recruitment Portal is a web application for managing candidates, creating jobs, uploading resumes, matching candidates to jobs, and generating tailored interview kits with AI.

## Prerequisites

Install the following before starting:

- Python 3.10 or newer
- Node.js 18 or newer and npm
- A Groq API key for AI-powered interview-kit generation

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Subham999100/AI-Recruitment-Portal.git
cd AI-Recruitment-Portal
```

### 2. Create and activate a Python virtual environment

On Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

On macOS or Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install backend dependencies

Run this from the project root:

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a file named `.env` in the project root:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

Replace `your_groq_api_key` with your actual key. Keep `.env` private and never commit it to GitHub.

### 5. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

## Run the application

The backend and frontend run as separate processes. Start each one in its own terminal, with the virtual environment activated in the backend terminal.

### Start the backend

From the project root:

```bash
uvicorn Backend.main:app --reload
```

Backend URLs:

- API: `http://127.0.0.1:8000`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

### Start the frontend

From the project root:

```bash
cd frontend
npm run dev
```

Open the URL shown by Vite, normally `http://localhost:5173`.

## Typical workflow

1. Open the frontend and create an account or sign in.
2. Add a job with its title and description.
3. Upload one or more candidate resumes from the Upload page.
4. Review extracted candidate information and matching scores.
5. Open a candidate profile to review details and update the candidate status.
6. Generate an interview kit using the candidate's resume, experience, and selected job.

## Useful frontend commands

Run these commands from the `frontend` directory:

```bash
npm run dev       # Start the development server
npm run build     # Type-check and create a production build
npm run lint      # Check frontend code with ESLint
npm run preview   # Preview the production build locally
```

## Troubleshooting

- If the frontend cannot reach the API, confirm that the backend is running on port `8000`.
- If the frontend uses a different port, set `FRONTEND_ORIGINS` before starting the backend, for example: `FRONTEND_ORIGINS=http://localhost:5174`.
- If AI interview generation is unavailable, check that `GROQ_API_KEY` is present in the root `.env` file and restart the backend.
- The backend creates its local database tables when it starts. Resume files are stored in the project's upload directory.

## About the project

This project combines a React and TypeScript frontend with a Python FastAPI backend. The frontend provides the recruitment dashboard, authentication screens, candidate management, job management, resume upload, and candidate profile views. The backend exposes the API, stores recruitment data in a local database, parses uploaded PDF resumes, creates embeddings for semantic matching, and connects to Groq for AI-generated interview questions.

The goal is to reduce repetitive recruiting work by bringing candidate information, job requirements, resume matching, and interview preparation into one workflow. It is intended as a local development project and a foundation that can be extended with production authentication, hosted storage, additional model providers, and deployment configuration.
