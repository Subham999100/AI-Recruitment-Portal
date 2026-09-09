import os
import json
import io
from typing import Literal, Optional
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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

# Create database tables when the application starts
create_tables()
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


# -------------------------
# Upload Resumes
# -------------------------

@app.post("/resumes/upload")
async def upload_resumes(
    files: list[UploadFile] = File(...)
):
    successful = []
    failed = []

    for file in files:
        try:
            result = process_resume(file)
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
def list_candidates():
    connection = get_db_connection()
    rows = connection.execute("SELECT * FROM candidates ORDER BY id DESC").fetchall()
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
def get_candidate(candidate_id: int):
    connection = get_db_connection()
    row = connection.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
    if row is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Candidate not found")
    match = connection.execute(
        "SELECT * FROM candidate_matches WHERE candidate_id = ? ORDER BY matched_at DESC, id DESC LIMIT 1",
        (candidate_id,),
    ).fetchone()
    connection.close()
    return {"data": _candidate_response(row, match)}


@app.patch("/candidates/{candidate_id}/status")
def update_candidate_status(candidate_id: int, request: CandidateStatusRequest):
    connection = get_db_connection()
    cursor = connection.execute(
        "UPDATE candidates SET status = ? WHERE id = ?", (request.status, candidate_id)
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
def get_candidate_match(candidate_id: int):
    connection = get_db_connection()
    candidate = connection.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
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
    job = connection.execute("SELECT skills FROM jobs WHERE id = ?", (match["job_id"],)).fetchone()
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
def create_new_job(job: JobRequest):
    if not job.title.strip() or not job.description.strip():
        raise HTTPException(status_code=422, detail="Job title and description are required")
    try:
        result = create_job(job.title, job.description)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"data": result}


@app.post("/jobs/from-file")
async def create_job_from_file(
    file: UploadFile = File(...),
    title: str = Form(""),
):
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
        result = create_job(title.strip() or derived_title, description)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"data": result}


@app.get("/jobs")
def list_jobs():
    connection = get_db_connection()
    rows = connection.execute("SELECT * FROM jobs ORDER BY id DESC").fetchall()
    jobs = []
    for row in rows:
        count = connection.execute(
            "SELECT COUNT(*) AS count FROM candidate_matches WHERE job_id = ?", (row["id"],)
        ).fetchone()["count"]
        jobs.append(_job_response(row, count))
    connection.close()
    return {"data": jobs}


@app.get("/jobs/{job_id}")
def get_job(job_id: int):
    connection = get_db_connection()
    row = connection.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    if row is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Job not found")
    count = connection.execute(
        "SELECT COUNT(*) AS count FROM candidate_matches WHERE job_id = ?", (job_id,)
    ).fetchone()["count"]
    connection.close()
    return {"data": _job_response(row, count)}


# -------------------------
# Match Candidates
# -------------------------

@app.get("/matching/{job_id}")
def match_candidates(job_id: int):
    try:
        matches = get_top_candidates(job_id)
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
def get_dashboard():
    connection = get_db_connection()
    stats = {
        "total_candidates": connection.execute("SELECT COUNT(*) AS count FROM candidates").fetchone()["count"],
        "total_jobs": connection.execute("SELECT COUNT(*) AS count FROM jobs").fetchone()["count"],
        "shortlisted_candidates": connection.execute(
            "SELECT COUNT(*) AS count FROM candidates WHERE status = 'Shortlisted'"
        ).fetchone()["count"],
        "interviews_scheduled": connection.execute(
            "SELECT COUNT(*) AS count FROM candidates WHERE status = 'Interview Scheduled'"
        ).fetchone()["count"],
    }
    candidate_rows = connection.execute("SELECT * FROM candidates ORDER BY id DESC LIMIT 4").fetchall()
    recent_candidates = []
    for row in candidate_rows:
        match = connection.execute(
            "SELECT * FROM candidate_matches WHERE candidate_id = ? ORDER BY matched_at DESC, id DESC LIMIT 1",
            (row["id"],),
        ).fetchone()
        recent_candidates.append(_candidate_response(row, match))
    job_rows = connection.execute("SELECT * FROM jobs ORDER BY id DESC LIMIT 3").fetchall()
    recent_jobs = []
    for row in job_rows:
        count = connection.execute(
            "SELECT COUNT(*) AS count FROM candidate_matches WHERE job_id = ?", (row["id"],)
        ).fetchone()["count"]
        recent_jobs.append(_job_response(row, count))
    connection.close()
    return {"data": {"stats": stats, "recent_jobs": recent_jobs, "recent_candidates": recent_candidates}}
