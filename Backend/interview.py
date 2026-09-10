from Backend.database import get_db_connection
from Backend.llm import get_groq_client, MODEL
import json


def generate_interview_questions(job_id, candidate_id, user_id):
    connection = get_db_connection()

    job = connection.execute(
        """
        SELECT title, skills
        FROM jobs
        WHERE id = %s AND user_id = %s
        """,
        (job_id, user_id)
    ).fetchone()

    candidate = connection.execute(
        """
        SELECT name, resume_text
        FROM candidates
        WHERE id = %s AND user_id = %s
        """,
        (candidate_id, user_id)
    ).fetchone()

    connection.close()

    if not job:
        raise ValueError("Job not found")

    if not candidate:
        raise ValueError("Candidate not found")

    skills = job["skills"] or []

    prompt = f"""
Generate interview questions and expected answers for a recruiter.

Candidate Resume:
{candidate["resume_text"]}

Job Skills:
{", ".join(skills)}

Create 8 interview questions based on the candidate's resume
and the job skills.

Rules:
- Focus only on the listed job skills.
- Questions should test practical understanding.
- Use the resume to make questions relevant to the candidate.
- Give a short, technically correct expected answer.
- Do not invent experience that is not in the resume.
- Return valid JSON only.

Return exactly:

{{
    "questions": [
        {{
            "question": "Question here",
            "answer": "Expected answer here"
        }}
    ]
}}
"""

    client = get_groq_client()

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a technical interviewer helping recruiters prepare interviews."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0,
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)

    return {
        "candidate_id": candidate_id,
        "candidate_name": candidate["name"],
        "questions": result.get("questions", [])
    }