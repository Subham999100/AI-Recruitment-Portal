import json
import os
import re

from Backend.database import get_db_connection
from Backend.embeddings import create_embedding
from Backend.pdf_parser import extract_text_from_pdf


UPLOAD_FOLDER = "uploads/resumes"


def extract_candidate_info(text):
    """
    Try to find the candidate's name and email from resume text.
    """

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    name = lines[0] if lines else "Unknown"

    email_match = re.search(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        text
    )

    email = email_match.group(0) if email_match else None

    return name, email


def process_resume(file):
    """
    Process one resume and save it to the database.
    """

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    filename = os.path.basename(file.filename)

    if not filename.lower().endswith(".pdf"):
        raise ValueError("File is not a PDF")

    file_path = os.path.join(UPLOAD_FOLDER, filename)

    # Save PDF
    with open(file_path, "wb") as output_file:
        output_file.write(file.file.read())

    # Extract text
    resume_text = extract_text_from_pdf(file_path)

    if not resume_text:
        raise ValueError("Could not extract text from PDF")

    # Extract basic candidate information
    name, email = extract_candidate_info(resume_text)

    # Create embedding
    embedding = create_embedding(resume_text)

    # Save candidate
    connection = get_db_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO candidates
        (name, email, resume_filename, resume_text, embedding)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            name,
            email,
            filename,
            resume_text,
            json.dumps(embedding)
        )
    )

    candidate_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return {
        "candidate_id": candidate_id,
        "filename": filename
    }