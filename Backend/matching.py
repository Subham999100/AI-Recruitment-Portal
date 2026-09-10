import re

from Backend.database import get_db_connection
from Backend.llm_matcher import evaluate_candidate


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


def get_top_candidates(job_id, user_id, top_n=5):
    connection = get_db_connection()

    # Get the job belonging to the logged-in user
    job = connection.execute(
        """
        SELECT
            id,
            title,
            description,
            embedding,
            skills,
            keywords
        FROM jobs
        WHERE id = %s
          AND user_id = %s
        """,
        (job_id, user_id)
    ).fetchone()

    if job is None:
        connection.close()
        raise ValueError("Job not found")

    job_embedding = job["embedding"]
    skills = job["skills"] or []
    keywords = job["keywords"] or []

    # Step 1: pgvector retrieves only the top 5 candidates
    candidates = connection.execute(
        """
        SELECT
            id,
            name,
            resume_filename,
            resume_text,
            1 - (embedding <=> %s) AS semantic_similarity
        FROM candidates
        WHERE user_id = %s
          AND embedding IS NOT NULL
        ORDER BY embedding <=> %s
        LIMIT 5
        """,
        (
            job_embedding,
            user_id,
            job_embedding
        )
    ).fetchall()

    connection.close()

    matches = []

    # Step 2: LLM evaluates only these 5 candidates
    for candidate in candidates:

        semantic_similarity = float(
            candidate["semantic_similarity"]
        )

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

        llm_evaluation = evaluate_candidate(
            job["description"],
            candidate["resume_text"]
        )

        llm_score = float(
            llm_evaluation.get("overall_score", 0)
        )

        # Hybrid score
        final_score = (
            semantic_score * 0.20
            + llm_score * 0.70
            + skill_score * 0.10
        )

        matches.append({
            "candidate_id": candidate["id"],
            "name": candidate["name"],
            "resume_filename": candidate["resume_filename"],

            "match_score": round(final_score, 2),

            "semantic_score": round(semantic_score, 2),
            "llm_score": round(llm_score, 2),
            "skill_score": round(skill_score, 2),
            "keyword_score": round(keyword_score, 2),

            "strengths": llm_evaluation.get(
                "strengths", []
            ),

            "gaps": llm_evaluation.get(
                "gaps", []
            ),

            "evidence": llm_evaluation.get(
                "evidence", []
            ),

            "recommendation": llm_evaluation.get(
                "recommendation",
                "partial_match"
            )
        })

    # Step 3: Rank using the hybrid score
    matches.sort(
        key=lambda candidate: candidate["match_score"],
        reverse=True
    )

    return matches[:top_n]