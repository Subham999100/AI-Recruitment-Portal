import os

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from Backend.resume import process_resume
from Backend.job import create_job
from Backend.matching import get_top_candidates


app = FastAPI(
    title="AI Recruitment Portal API"
)


# -------------------------
# CORS
# -------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# Request Models
# -------------------------

class JobRequest(BaseModel):
    title: str
    description: str


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
        masked_key = (
            raw[:6] + "..." + raw[-4:]
            if len(raw) > 10
            else "***"
        )

    return {
        "configured": api_key_set,
        "masked_key": masked_key,
        "model": "openai/gpt-oss-20b"
    }


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
    try:
        return create_job(
            job.title,
            job.description
        )

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
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
        raise HTTPException(
            status_code=404,
            detail=str(error)
        )