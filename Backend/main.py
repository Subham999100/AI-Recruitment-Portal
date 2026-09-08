import os
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from Backend.database import create_tables
from Backend.resume import process_resume
from Backend.job import create_job
from Backend.matching import get_top_candidates
from Backend.llm import generate_interview_kit_llm


app = FastAPI(
    title="AI Recruitment Portal API"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables when the application starts
create_tables()


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
    api_key: Optional[str] = None
    model: Optional[str] = "llama-3.3-70b-versatile"


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
        "default_model": "llama-3.3-70b-versatile"
    }


# -------------------------
# AI Interview Kit Generation
# -------------------------

@app.post("/interview/generate")
def generate_interview_kit(request: InterviewKitRequest):
    """
    Generate customized interview questions using Groq LLM calibrated
    against candidate resume, job description, and years of experience.
    """
    try:
        result = generate_interview_kit_llm(
            job_title=request.job_title,
            job_description=request.job_description,
            candidate_name=request.candidate_name,
            candidate_resume=request.candidate_resume,
            candidate_experience=request.candidate_experience,
            api_key=request.api_key,
            model=request.model or "llama-3.3-70b-versatile"
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
# Create Job
# -------------------------

@app.post("/jobs")
def create_new_job(job: JobRequest):
    return create_job(
        job.title,
        job.description
    )


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
        return {
            "error": str(error)
        }