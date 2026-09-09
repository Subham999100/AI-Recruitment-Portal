from psycopg.types.json import Jsonb

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
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            title,
            description,
            embedding,
            Jsonb(skills),
            Jsonb(keywords)
        )
    )

    job_id = cursor.fetchone()[0]

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "job_id": job_id,
        "title": title,
        "skills": skills,
        "keywords": keywords
    }