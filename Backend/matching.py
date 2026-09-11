import json
import re

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from Backend.database import get_db_connection


def normalize_text(text):
    """
    Convert text to lowercase and normalize spaces.
    """
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def contains_term(text, term):
    """
    Check whether a skill/keyword actually exists in the resume.

    Word boundaries prevent things like:
    SQL matching NoSQL accidentally.
    """
    text = normalize_text(text)
    term = normalize_text(term)

    pattern = r"(?<!\w)" + re.escape(term) + r"(?!\w)"

    return re.search(pattern, text) is not None


def calculate_skill_score(resume_text, skills):
    """
    Calculate percentage of JD skills found in the resume.
    """

    if not skills:
        return 0

    matched_skills = 0

    for skill in skills:
        if contains_term(resume_text, skill):
            matched_skills += 1

    return (matched_skills / len(skills)) * 100


def calculate_keyword_score(resume_text, keywords):
    """
    Calculate percentage of JD keywords found in the resume.
    """

    if not keywords:
        return 0

    matched_keywords = 0

    for keyword in keywords:
        if contains_term(resume_text, keyword):
            matched_keywords += 1

    return (matched_keywords / len(keywords)) * 100


def calculate_semantic_score(job_embedding, candidate_embedding):
    """
    Calculate semantic similarity between JD and resume.

    Embeddings are normalized, so cosine similarity is already the
    similarity signal. Do not shift it by 50 points: unrelated text
    should not receive a passing score merely because cosine similarity
    is close to zero.
    """

    similarity = cosine_similarity(
        job_embedding,
        candidate_embedding
    )[0][0]

    score = max(float(similarity), 0.0) * 100

    return min(score, 100.0)


def calculate_final_score(semantic_score, skill_score, keyword_score, has_required_skills):
    """Combine evidence and prevent semantic similarity from hiding skill gaps."""

    score = (
        semantic_score * 0.40
        + skill_score * 0.45
        + keyword_score * 0.15
    )

    if has_required_skills:
        if skill_score == 0:
            return min(score, 20.0)
        if skill_score < 25:
            return min(score, 35.0)

    return min(max(score, 0.0), 100.0)


def get_top_candidates(job_id, owner_id=None, include_all=False, top_n=None):

    connection = get_db_connection()

    # Get job
    if include_all:
        job = connection.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    else:
        job = connection.execute("SELECT * FROM jobs WHERE id = ? AND owner_id = ?", (job_id, owner_id)).fetchone()

    if job is None:
        connection.close()
        raise ValueError("Job not found")

    # Job embedding
    job_embedding = np.array(
        json.loads(job["embedding"])
    ).reshape(1, -1)

    # Skills and keywords stored as JSON
    skills = json.loads(job["skills"]) if job["skills"] else []
    keywords = json.loads(job["keywords"]) if job["keywords"] else []

    # Get candidates
    candidates = connection.execute(
        "SELECT * FROM candidates" if include_all else "SELECT * FROM candidates WHERE owner_id = ?",
        () if include_all else (owner_id,),
    ).fetchall()

    matches = []

    for candidate in candidates:

        if not candidate["embedding"]:
            continue

        candidate_embedding = np.array(
            json.loads(candidate["embedding"])
        ).reshape(1, -1)

        # -------------------------
        # 1. Semantic score - 40%
        # -------------------------

        semantic_score = calculate_semantic_score(
            job_embedding,
            candidate_embedding
        )

        # -------------------------
        # 2. Skill score - 45%
        # -------------------------

        skill_score = calculate_skill_score(
            candidate["resume_text"],
            skills
        )

        # -------------------------
        # 3. Keyword score - 15%
        # -------------------------

        keyword_score = calculate_keyword_score(
            candidate["resume_text"],
            keywords
        )

        # -------------------------
        # Final score
        # -------------------------

        final_score = calculate_final_score(
            semantic_score,
            skill_score,
            keyword_score,
            bool(skills),
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

        connection.execute(
            """
            INSERT INTO candidate_matches
            (job_id, candidate_id, match_score, semantic_score, skill_score, keyword_score)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(job_id, candidate_id) DO UPDATE SET
                match_score = excluded.match_score,
                semantic_score = excluded.semantic_score,
                skill_score = excluded.skill_score,
                keyword_score = excluded.keyword_score,
                matched_at = CURRENT_TIMESTAMP
            """,
            (
                job_id, candidate["id"], round(final_score, 2),
                round(semantic_score, 2), round(skill_score, 2), round(keyword_score, 2),
            ),
        )

    connection.commit()
    connection.close()

    # Highest score first
    matches.sort(
        key=lambda candidate: candidate["match_score"],
        reverse=True
    )

    return matches[:top_n] if top_n else matches
