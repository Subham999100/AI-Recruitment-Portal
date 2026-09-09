import re

from Backend.database import get_db_connection


def normalize_text(text):
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def contains_term(text, term):
    text = normalize_text(text)
    term = normalize_text(term)

    pattern = r"(?<!\w)" + re.escape(term) + r"(?!\w)"

    return re.search(pattern, text) is not None


def calculate_skill_score(resume_text, skills):
    if not skills:
        return 0.0

    matched_skills = 0

    for skill in skills:
        if contains_term(resume_text, skill):
            matched_skills += 1

    return (matched_skills / len(skills)) * 100


def calculate_keyword_score(resume_text, keywords):
    if not keywords:
        return 0.0

    matched_keywords = 0

    for keyword in keywords:
        if contains_term(resume_text, keyword):
            matched_keywords += 1

    return (matched_keywords / len(keywords)) * 100


def get_top_candidates(job_id, top_n=5):
    connection = get_db_connection()

    job = connection.execute(
        """
        SELECT id, title, description, embedding, skills, keywords
        FROM jobs
        WHERE id = %s
        """,
        (job_id,)
    ).fetchone()

    if job is None:
        connection.close()
        raise ValueError("Job not found")

    job_embedding = job["embedding"]

    skills = job["skills"] or []
    keywords = job["keywords"] or []

    # First retrieve the most semantically similar candidates
    candidates = connection.execute(
        """
        SELECT
            id,
            name,
            resume_filename,
            resume_text,
            1 - (embedding <=> %s) AS semantic_similarity
        FROM candidates
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> %s
        LIMIT 20
        """,
        (job_embedding, job_embedding)
    ).fetchall()

    connection.close()

    matches = []

    for candidate in candidates:
        semantic_similarity = float(candidate["semantic_similarity"])

        # Convert cosine similarity to a 0-100 score.
        semantic_score = max(
            0,
            min(100, semantic_similarity * 100)
        )

        skill_score = calculate_skill_score(
            candidate["resume_text"],
            skills
        )

        keyword_score = calculate_keyword_score(
            candidate["resume_text"],
            keywords
        )

        # Hybrid ranking
        final_score = (
            semantic_score * 0.50
            + skill_score * 0.35
            + keyword_score * 0.15
        )

        matches.append({
            "candidate_id": candidate["id"],
            "name": candidate["name"],
            "resume_filename": candidate["resume_filename"],
            "match_score": round(final_score, 2),
            "semantic_score": round(semantic_score, 2),
            "skill_score": round(skill_score, 2),
            "keyword_score": round(keyword_score, 2)
        })

    matches.sort(
        key=lambda candidate: candidate["match_score"],
        reverse=True
    )

    return matches[:top_n]