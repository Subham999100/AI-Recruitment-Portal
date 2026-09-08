from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel

from Backend.database import create_tables
from Backend.resume import process_resume
from Backend.job import create_job
from Backend.matching import get_top_candidates


app = FastAPI(
    title="AI Recruitment Portal API"
)


# Create database tables when the application starts
create_tables()


# -------------------------
# Request Models
# -------------------------

class JobRequest(BaseModel):
    title: str
    description: str


# -------------------------
# Home
# -------------------------

@app.get("/")
def home():
    return {
        "message": "AI Recruitment Portal Backend is running"
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