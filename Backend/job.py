from psycopg.types.json import Jsonb

from Backend.database import get_db_connection
from Backend.embeddings import create_embedding
from Backend.llm import extract_skills_and_keywords


def create_job(title, description, user_id):
    embedding = create_embedding(description)

    analysis = extract_skills_and_keywords(description)

    skills = analysis["skills"]
    keywords = analysis["keywords"]

    with get_db_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO jobs
            (user_id, title, description, embedding, skills, keywords)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                user_id,
                title,
                description,
                embedding,
                Jsonb(skills),
                Jsonb(keywords)
            )
        )

        job_id = cursor.fetchone()["id"]
        connection.commit()

    return {
        "job_id": job_id,
        "title": title,
        "skills": skills,
        "keywords": keywords
    }