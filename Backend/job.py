import json

from Backend.database import get_db_connection
from Backend.embeddings import create_embedding
from Backend.llm import extract_skills_and_keywords


def create_job(title, description):

    # Create embedding for the job description
    embedding = create_embedding(description)

    # Extract skills and keywords using Groq
    analysis = extract_skills_and_keywords(description)

    skills = analysis["skills"]
    keywords = analysis["keywords"]

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO jobs
        (title, description, embedding, skills, keywords)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            title,
            description,
            json.dumps(embedding),
            json.dumps(skills),
            json.dumps(keywords)
        )
    )

    job_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return {
        "job_id": job_id,
        "title": title,
        "skills": skills,
        "keywords": keywords
    }