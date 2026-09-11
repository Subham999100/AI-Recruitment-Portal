import json

from Backend.database import get_db_connection
from Backend.embeddings import create_embedding
from Backend.llm import extract_skills_and_keywords


def create_job(title, description, owner_id):

    # Create embedding for the job description
    embedding = create_embedding(description)

    # Extract skills and keywords using Grok
    analysis = extract_skills_and_keywords(description)

    skills = analysis["skills"]
    keywords = analysis["keywords"]

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO jobs
        (title, description, embedding, skills, keywords, owner_id)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING id
        """,
        (
            title,
            description,
            json.dumps(embedding),
            json.dumps(skills),
            json.dumps(keywords),
            owner_id,
        )
    )

    job_id = cursor.fetchone()["id"]

    connection.commit()
    connection.close()

    return {
        "job_id": job_id,
        "title": title,
        "skills": skills,
        "keywords": keywords
    }