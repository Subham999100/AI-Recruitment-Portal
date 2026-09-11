import os
import json
import io
import logging
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Literal, Optional
import jwt
import bcrypt
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

from Backend.database import create_tables, get_db_connection
from Backend.embeddings import initialize_embedding_model
from Backend.resume import process_resume
from Backend.job import create_job
from Backend.matching import get_top_candidates
from Backend.llm import DEFAULT_MODEL, SUPPORTED_MODELS, generate_interview_kit_llm
from pypdf import PdfReader


app = FastAPI(
    title="AI Recruitment Portal API"
)

logger = logging.getLogger(__name__)

frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def require_auth(request: Request, call_next):
    public_paths = {"/", "/docs", "/openapi.json", "/redoc", "/auth/register", "/auth/login"}
    if request.method == "OPTIONS" or request.url.path in public_paths:
        return await call_next(request)

    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    jwt_secret = os.getenv("JWT_SECRET")

    if scheme.lower() != "bearer" or not token or not jwt_secret:
        return JSONResponse(status_code=401, content={"detail": "Authentication required"})

    try:
        claims = jwt.decode(token, jwt_secret, algorithms=["HS256"], audience="ai-recruitment-portal")
    except jwt.InvalidTokenError:
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired authentication token"})

    request.state.auth_user = {
        "id": int(claims["sub"]),
        "email": claims.get("email", ""),
    }

    if request.url.path != "/auth/me":
        user = _find_user(request.state.auth_user["id"])
        if user is None:
            return JSONResponse(status_code=403, content={"detail": "Registration approval is required"})
        if user["status"] != "APPROVED":
            message = (
                "Your account is awaiting administrator approval."
                if user["status"] == "PENDING"
                else "Your registration request was rejected."
            )
            return JSONResponse(status_code=403, content={"detail": message})
        request.state.auth_user["role"] = user["role"]

    return await call_next(request)

def _bootstrap_admin():
    email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("ADMIN_PASSWORD", "")
    if not email or not password:
        logger.warning("ADMIN_EMAIL and ADMIN_PASSWORD are required to bootstrap the admin account")
        return
    connection = get_db_connection()
    existing = connection.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing is None:
        connection.execute(
            "INSERT INTO users (name, email, password_hash, role, status, approved_at) VALUES (?, ?, ?, 'ADMIN', 'APPROVED', CURRENT_TIMESTAMP)",
            (os.getenv("ADMIN_NAME", "Administrator"), email, bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()),
        )
        connection.commit()
    connection.close()


# Create database tables when the application starts.
create_tables()
_bootstrap_admin()
initialize_embedding_model()


# -------------------------
# Request Models
# -------------------------

class JobRequest(BaseModel):
    title: str
    description: str


class InterviewKitRequest(BaseModel):
    job_title: str
    job_description: str
    candidate_name: str
    candidate_resume: str
    candidate_experience: float
    model: Optional[str] = "llama-3.3-70b-versatile"


class CandidateStatusRequest(BaseModel):
    status: Literal[
        "New", "Under Review", "Shortlisted", "Interview Scheduled", "Selected", "Rejected"
    ]


class RegistrationRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AdminCreateUserRequest(BaseModel):
    name: str
    email: str
    password: str


class UserStatusRequest(BaseModel):
    status: Literal["APPROVED", "REJECTED"]


def _find_user(user_id):
    if not user_id:
        return None
    connection = get_db_connection()
    user = connection.execute(
        "SELECT * FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    connection.close()
    return user


def _user_response(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
        "status": row["status"],
        "created_at": row["created_at"],
        "approved_at": row["approved_at"],
        "approved_by": row["approved_by"],
    }


def _require_user(request: Request):
    user = _find_user(request.state.auth_user.get("id"))
    if user is None:
        raise HTTPException(status_code=403, detail="Registration approval is required")
    return user


def _require_admin(request: Request):
    user = _require_user(request)
    if user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Administrator access is required")
    return user


def _access_context(request: Request):
    user = _require_user(request)
    return user, user["role"] == "ADMIN"


def _send_registration_email(name, email):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    admin_email = os.getenv("ADMIN_EMAIL")
    if not all((smtp_host, smtp_username, smtp_password, admin_email)):
        logger.warning("Registration email not sent: SMTP or ADMIN_EMAIL is not configured")
        return

    message = EmailMessage()
    message["Subject"] = "New Employee Registration Request"
    message["From"] = smtp_username
    message["To"] = admin_email
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    message.set_content(
        "A new employee has requested access to the recruitment portal.\n\n"
        f"Name: {name}\nEmail: {email}\n\n"
        f"Review the request: {frontend_url}/admin"
    )
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as smtp:
        smtp.starttls()
        smtp.login(smtp_username, smtp_password)
        smtp.send_message(message)


@app.post("/auth/register", status_code=201)
def register_user(request: RegistrationRequest):
    name = request.name.strip()
    email = request.email.strip().lower()
    if not name or "@" not in email or len(request.password) < 8:
        raise HTTPException(status_code=422, detail="Name, valid email, and password of at least 8 characters are required")

    connection = get_db_connection()
    existing = connection.execute(
        "SELECT id FROM users WHERE email = ?",
        (email,),
    ).fetchone()
    if existing:
        connection.close()
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    connection.execute(
        "INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, 'EMPLOYEE', 'PENDING')",
        (name, email, bcrypt.hashpw(request.password.encode(), bcrypt.gensalt()).decode()),
    )
    connection.commit()
    connection.close()
    try:
        _send_registration_email(name, email)
    except (OSError, smtplib.SMTPException, ValueError) as error:
        logger.error("Registration email failed: %s", error)
    return {"message": "Registration submitted successfully. Your account is waiting for administrator approval."}


@app.post("/auth/login")
def login_user(request: LoginRequest):
    email = request.email.strip().lower()
    connection = get_db_connection()
    user = connection.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    connection.close()
    if user is None or not bcrypt.checkpw(request.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user["status"] == "PENDING":
        raise HTTPException(status_code=403, detail="Your account is awaiting administrator approval.")
    if user["status"] == "REJECTED":
        raise HTTPException(status_code=403, detail="Your registration request was rejected.")
    token = jwt.encode(
        {"sub": str(user["id"]), "email": user["email"], "aud": "ai-recruitment-portal"},
        os.environ["JWT_SECRET"], algorithm="HS256"
    )
    return {"access_token": token, "token_type": "bearer", "user": _user_response(user)}


@app.get("/auth/me")
def current_user(request: Request):
    user = _require_user(request)
    return {"data": _user_response(user)}


@app.get("/admin/users")
def list_users(request: Request):
    _require_admin(request)
    connection = get_db_connection()
    rows = connection.execute("SELECT * FROM users ORDER BY CASE status WHEN 'PENDING' THEN 0 ELSE 1 END, created_at DESC").fetchall()
    connection.close()
    return {"data": [_user_response(row) for row in rows]}


@app.post("/admin/users", status_code=201)
def create_admin_user(request: AdminCreateUserRequest, auth_request: Request):
    _require_admin(auth_request)
    name = request.name.strip()
    email = request.email.strip().lower()
    if not name or "@" not in email or len(request.password) < 8:
        raise HTTPException(status_code=422, detail="Name, valid email, and password of at least 8 characters are required")
    connection = get_db_connection()
    existing = connection.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        connection.close()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    row = connection.execute(
        """
        INSERT INTO users (name, email, password_hash, role, status, approved_at, approved_by)
        VALUES (?, ?, ?, 'EMPLOYEE', 'APPROVED', CURRENT_TIMESTAMP, ?)
        RETURNING *
        """,
        (name, email, bcrypt.hashpw(request.password.encode(), bcrypt.gensalt()).decode(), auth_request.state.auth_user["id"]),
    ).fetchone()
    connection.commit()
    connection.close()
    return {"data": _user_response(row)}


@app.post("/admin/users/{user_id}/approve")
def approve_user(user_id: int, request: Request):
    admin = _require_admin(request)
    connection = get_db_connection()
    cursor = connection.execute(
        "UPDATE users SET status = 'APPROVED', approved_at = ?, approved_by = ? WHERE id = ? AND role = 'EMPLOYEE'",
        (datetime.now(timezone.utc).isoformat(), admin["id"], user_id),
    )
    connection.commit()
    connection.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Pending employee not found")
    return {"success": True}


@app.post("/admin/users/{user_id}/reject")
def reject_user(user_id: int, request: Request):
    _require_admin(request)
    connection = get_db_connection()
    cursor = connection.execute(
        "UPDATE users SET status = 'REJECTED' WHERE id = ? AND role = 'EMPLOYEE'",
        (user_id,),
    )
    connection.commit()
    connection.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"success": True}


@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, request: Request):
    admin = _require_admin(request)
    if admin["id"] == user_id:
        raise HTTPException(status_code=400, detail="The current administrator cannot delete their own account")
    connection = get_db_connection()
    cursor = connection.execute("DELETE FROM users WHERE id = ? AND role = 'EMPLOYEE'", (user_id,))
    connection.commit()
    connection.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"success": True}


def _parse_json(value, fallback):
    try:
        return json.loads(value) if value else fallback
    except json.JSONDecodeError:
        return fallback


def _candidate_response(row, match=None):
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"] or "",
        "skills": _parse_json(row["skills"], []),
        "experience": row["experience"] or 0,
        "status": row["status"],
        "summary": row["summary"] or "",
        "resume_file": row["resume_filename"],
        "date_added": row["uploaded_at"],
        "match_score": match["match_score"] if match else None,
    }


def _job_response(row, candidate_count=0):
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "skills": _parse_json(row["skills"], []),
        "keywords": _parse_json(row["keywords"], []),
        "candidate_count": candidate_count,
    }


# -------------------------
# Home & Status
# -------------------------

@app.get("/")
def home():
    return {
        "message": "AI Recruitment Portal Backend is running",
        "groq_configured": bool(os.getenv("GROQ_API_KEY"))
    }


@app.get("/api/groq/status")
def groq_status():
    api_key_set = bool(os.getenv("GROQ_API_KEY"))
    masked_key = ""
    if api_key_set:
        raw = os.getenv("GROQ_API_KEY", "")
        masked_key = raw[:6] + "..." + raw[-4:] if len(raw) > 10 else "***"

    return {
        "configured": api_key_set,
        "masked_key": masked_key,
        "default_model": DEFAULT_MODEL,
        "supported_models": SUPPORTED_MODELS,
    }


# -------------------------
# AI Interview Kit Generation
# -------------------------

@app.post("/interview/generate")
def generate_interview_kit(request: InterviewKitRequest):
    """
    Generate customized interview questions using Groq calibrated
    against candidate resume, job description, and years of experience.
    """
    try:
        result = generate_interview_kit_llm(
            job_title=request.job_title,
            job_description=request.job_description,
            candidate_name=request.candidate_name,
            candidate_resume=request.candidate_resume,
            candidate_experience=request.candidate_experience,
            model=request.model or DEFAULT_MODEL
        )
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@app.post("/candidates/{candidate_id}/interview/generate")
def generate_candidate_interview_kit(candidate_id: int, request: Request):
    """Generate exactly 20 questions for a candidate's latest matched job."""
    connection = get_db_connection()
    row = connection.execute(
        """
        SELECT candidates.name, candidates.resume_text, candidates.experience,
               jobs.title AS job_title, jobs.description AS job_description
        FROM candidates
        LEFT JOIN candidate_matches ON candidate_matches.candidate_id = candidates.id
        LEFT JOIN jobs ON jobs.id = candidate_matches.job_id
        WHERE candidates.id = ? AND (candidates.owner_id = ? OR ?)
        ORDER BY candidate_matches.matched_at DESC, candidate_matches.id DESC
        LIMIT 1
        """,
        (candidate_id, request.state.auth_user["id"], request.state.auth_user.get("role") == "ADMIN"),
    ).fetchone()
    connection.close()

    if row is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if not row["job_title"] or not row["job_description"]:
        raise HTTPException(
            status_code=400,
            detail="Generate a candidate match before generating interview questions.",
        )

    try:
        result = generate_interview_kit_llm(
            job_title=row["job_title"],
            job_description=row["job_description"],
            candidate_name=row["name"],
            candidate_resume=row["resume_text"],
            candidate_experience=row["experience"],
            model=DEFAULT_MODEL,
        )
        return {"success": True, "data": result}
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


# -------------------------
# Upload Resumes
# -------------------------

@app.post("/resumes/upload")
async def upload_resumes(
    files: list[UploadFile] = File(...),
    request: Request = None,
):
    user, _ = _access_context(request)
    successful = []
    failed = []

    for file in files:
        try:
            result = process_resume(file, user["id"])
            successful.append(result)

        except Exception as error:
            failed.append({
                "filename": file.filename,
                "error": str(error)
            })

    return {
        "total_uploaded": len(files),
        "successful_resumes": successful,
        "failed_resumes": failed
    }


# -------------------------
# Candidates
# -------------------------

@app.get("/candidates")
def list_candidates(request: Request):
    user, is_admin = _access_context(request)
    connection = get_db_connection()
    rows = connection.execute(
        "SELECT * FROM candidates ORDER BY id DESC" if is_admin else "SELECT * FROM candidates WHERE owner_id = ? ORDER BY id DESC",
        () if is_admin else (user["id"],),
    ).fetchall()
    candidates = []
    for row in rows:
        match = connection.execute(
            "SELECT * FROM candidate_matches WHERE candidate_id = ? ORDER BY matched_at DESC, id DESC LIMIT 1",
            (row["id"],),
        ).fetchone()
        candidates.append(_candidate_response(row, match))
    connection.close()
    return {"data": candidates}


@app.get("/candidates/{candidate_id}")
def get_candidate(candidate_id: int, request: Request):
    user, is_admin = _access_context(request)
    connection = get_db_connection()
    row = connection.execute(
        "SELECT * FROM candidates WHERE id = ?" if is_admin else "SELECT * FROM candidates WHERE id = ? AND owner_id = ?",
        (candidate_id,) if is_admin else (candidate_id, user["id"]),
    ).fetchone()
    if row is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Candidate not found")
    match = connection.execute(
        "SELECT * FROM candidate_matches WHERE candidate_id = ? ORDER BY matched_at DESC, id DESC LIMIT 1",
        (candidate_id,),
    ).fetchone()
    connection.close()
    return {"data": _candidate_response(row, match)}


@app.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: int, request: Request):
    user, is_admin = _access_context(request)
    """Delete a candidate, their matches, and their stored resume file."""
    connection = get_db_connection()
    candidate = connection.execute(
        "SELECT resume_filename FROM candidates WHERE id = ?" if is_admin else "SELECT resume_filename FROM candidates WHERE id = ? AND owner_id = ?",
        (candidate_id,) if is_admin else (candidate_id, user["id"]),
    ).fetchone()
    if candidate is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Candidate not found")

    connection.execute("DELETE FROM candidate_matches WHERE candidate_id = ?", (candidate_id,))
    connection.execute("DELETE FROM candidates WHERE id = ?", (candidate_id,))
    connection.commit()
    connection.close()

    resume_filename = os.path.basename(candidate["resume_filename"] or "")
    resume_path = os.path.join("uploads", "resumes", resume_filename)
    if resume_filename and os.path.isfile(resume_path):
        os.remove(resume_path)

    return {"success": True, "candidate_id": candidate_id}


@app.patch("/candidates/{candidate_id}/status")
def update_candidate_status(candidate_id: int, request: CandidateStatusRequest, auth_request: Request):
    user, is_admin = _access_context(auth_request)
    connection = get_db_connection()
    cursor = connection.execute(
        "UPDATE candidates SET status = ? WHERE id = ?" if is_admin else "UPDATE candidates SET status = ? WHERE id = ? AND owner_id = ?",
        (request.status, candidate_id) if is_admin else (request.status, candidate_id, user["id"]),
    )
    if cursor.rowcount == 0:
        connection.close()
        raise HTTPException(status_code=404, detail="Candidate not found")
    connection.commit()
    row = connection.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
    match = connection.execute(
        "SELECT * FROM candidate_matches WHERE candidate_id = ? ORDER BY matched_at DESC, id DESC LIMIT 1",
        (candidate_id,),
    ).fetchone()
    connection.close()
    return {"data": _candidate_response(row, match)}


@app.get("/candidates/{candidate_id}/match")
def get_candidate_match(candidate_id: int, request: Request):
    user, is_admin = _access_context(request)
    connection = get_db_connection()
    candidate = connection.execute(
        "SELECT * FROM candidates WHERE id = ?" if is_admin else "SELECT * FROM candidates WHERE id = ? AND owner_id = ?",
        (candidate_id,) if is_admin else (candidate_id, user["id"]),
    ).fetchone()
    if candidate is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Candidate not found")
    match = connection.execute(
        "SELECT * FROM candidate_matches WHERE candidate_id = ? ORDER BY matched_at DESC, id DESC LIMIT 1",
        (candidate_id,),
    ).fetchone()
    if match is None:
        connection.close()
        raise HTTPException(status_code=404, detail="No match result is available for this candidate")
    job = connection.execute(
        "SELECT skills FROM jobs WHERE id = ?" if is_admin else "SELECT skills FROM jobs WHERE id = ? AND owner_id = ?",
        (match["job_id"],) if is_admin else (match["job_id"], user["id"]),
    ).fetchone()
    job_skills = _parse_json(job["skills"] if job else None, [])
    candidate_skills = _parse_json(candidate["skills"], [])
    candidate_skill_index = {skill.lower(): skill for skill in candidate_skills}
    matched_skills = [skill for skill in job_skills if skill.lower() in candidate_skill_index]
    missing_skills = [skill for skill in job_skills if skill.lower() not in candidate_skill_index]
    connection.close()
    return {
        "data": {
            "overall_score": match["match_score"],
            "skill_match": match["skill_score"],
            "semantic_match": match["semantic_score"],
            "keyword_match": match["keyword_score"],
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
        }
    }


# -------------------------
# Create Job
# -------------------------

@app.post("/jobs")
def create_new_job(job: JobRequest, request: Request):
    user, _ = _access_context(request)
    if not job.title.strip() or not job.description.strip():
        raise HTTPException(status_code=422, detail="Job title and description are required")
    try:
        result = create_job(job.title, job.description, user["id"])
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"data": result}


@app.post("/jobs/from-file")
async def create_job_from_file(
    file: UploadFile = File(...),
    title: str = Form(""),
    request: Request = None,
):
    user, _ = _access_context(request)
    """Create a job from a PDF or UTF-8 text job-description file."""
    filename = file.filename or "job-description"
    suffix = os.path.splitext(filename)[1].lower()
    content = await file.read()
    try:
        if suffix == ".pdf":
            reader = PdfReader(io.BytesIO(content))
            description = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
        elif suffix == ".txt":
            description = content.decode("utf-8").strip()
        else:
            raise HTTPException(status_code=422, detail="Job descriptions must be PDF or TXT files")
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=422, detail=f"Could not read job description: {error}") from error

    if not description:
        raise HTTPException(status_code=422, detail="The job description file contains no readable text")

    derived_title = os.path.splitext(os.path.basename(filename))[0].replace("_", " ").replace("-", " ")
    try:
        result = create_job(title.strip() or derived_title, description, user["id"])
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"data": result}


@app.get("/jobs")
def list_jobs(request: Request):
    user, is_admin = _access_context(request)
    connection = get_db_connection()
    rows = connection.execute(
        "SELECT * FROM jobs ORDER BY id DESC" if is_admin else "SELECT * FROM jobs WHERE owner_id = ? ORDER BY id DESC",
        () if is_admin else (user["id"],),
    ).fetchall()
    jobs = []
    for row in rows:
        count = connection.execute(
            "SELECT COUNT(*) AS count FROM candidate_matches WHERE job_id = ?", (row["id"],)
        ).fetchone()["count"]
        jobs.append(_job_response(row, count))
    connection.close()
    return {"data": jobs}


@app.get("/jobs/{job_id}")
def get_job(job_id: int, request: Request):
    user, is_admin = _access_context(request)
    connection = get_db_connection()
    row = connection.execute(
        "SELECT * FROM jobs WHERE id = ?" if is_admin else "SELECT * FROM jobs WHERE id = ? AND owner_id = ?",
        (job_id,) if is_admin else (job_id, user["id"]),
    ).fetchone()
    if row is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Job not found")
    count = connection.execute(
        "SELECT COUNT(*) AS count FROM candidate_matches WHERE job_id = ?", (job_id,)
    ).fetchone()["count"]
    connection.close()
    return {"data": _job_response(row, count)}


@app.delete("/jobs/{job_id}")
def delete_job(job_id: int, request: Request):
    user, is_admin = _access_context(request)
    """Delete a job description and its stored candidate matches."""
    connection = get_db_connection()
    job = connection.execute(
        "SELECT id FROM jobs WHERE id = ?" if is_admin else "SELECT id FROM jobs WHERE id = ? AND owner_id = ?",
        (job_id,) if is_admin else (job_id, user["id"]),
    ).fetchone()
    if job is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Job not found")

    connection.execute("DELETE FROM candidate_matches WHERE job_id = ?", (job_id,))
    connection.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
    connection.commit()
    connection.close()
    return {"success": True, "job_id": job_id}


# -------------------------
# Match Candidates
# -------------------------

@app.get("/matching/{job_id}")
def match_candidates(job_id: int, request: Request):
    user, is_admin = _access_context(request)
    try:
        matches = get_top_candidates(job_id, user["id"], is_admin)
        return {
            "job_id": job_id,
            "matches": matches
        }

    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


# -------------------------
# Dashboard
# -------------------------

@app.get("/dashboard")
def get_dashboard(request: Request):
    user, is_admin = _access_context(request)
    owner_filter = "" if is_admin else " WHERE owner_id = ?"
    owner_params = () if is_admin else (user["id"],)
    connection = get_db_connection()
    stats = {
        "total_candidates": connection.execute("SELECT COUNT(*) AS count FROM candidates" + owner_filter, owner_params).fetchone()["count"],
        "total_jobs": connection.execute("SELECT COUNT(*) AS count FROM jobs" + owner_filter, owner_params).fetchone()["count"],
        "shortlisted_candidates": connection.execute(
            "SELECT COUNT(*) AS count FROM candidates WHERE status = 'Shortlisted'" + ("" if is_admin else " AND owner_id = ?"),
            () if is_admin else (user["id"],),
        ).fetchone()["count"],
        "interviews_scheduled": connection.execute(
            "SELECT COUNT(*) AS count FROM candidates WHERE status = 'Interview Scheduled'" + ("" if is_admin else " AND owner_id = ?"),
            () if is_admin else (user["id"],),
        ).fetchone()["count"],
    }
    candidate_rows = connection.execute(
        "SELECT * FROM candidates ORDER BY id DESC LIMIT 4" if is_admin else "SELECT * FROM candidates WHERE owner_id = ? ORDER BY id DESC LIMIT 4",
        () if is_admin else (user["id"],),
    ).fetchall()
    recent_candidates = []
    for row in candidate_rows:
        match = connection.execute(
            "SELECT * FROM candidate_matches WHERE candidate_id = ? ORDER BY matched_at DESC, id DESC LIMIT 1",
            (row["id"],),
        ).fetchone()
        recent_candidates.append(_candidate_response(row, match))
    job_rows = connection.execute(
        "SELECT * FROM jobs ORDER BY id DESC LIMIT 3" if is_admin else "SELECT * FROM jobs WHERE owner_id = ? ORDER BY id DESC LIMIT 3",
        () if is_admin else (user["id"],),
    ).fetchall()
    recent_jobs = []
    for row in job_rows:
        count = connection.execute(
            "SELECT COUNT(*) AS count FROM candidate_matches WHERE job_id = ?", (row["id"],)
        ).fetchone()["count"]
        recent_jobs.append(_job_response(row, count))
    connection.close()
    return {"data": {"stats": stats, "recent_jobs": recent_jobs, "recent_candidates": recent_candidates}}
