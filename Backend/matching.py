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

    Convert cosine similarity from [-1, 1] to [0, 100].
    """

    similarity = cosine_similarity(
        job_embedding,
        candidate_embedding
    )[0][0]

    score = ((similarity + 1) / 2) * 100

    return score


def get_top_candidates(job_id, top_n=5):

    connection = get_db_connection()

    # Get job
    job = connection.execute(
        "SELECT * FROM jobs WHERE id = ?",
        (job_id,)
    ).fetchone()

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
        "SELECT * FROM candidates"
    ).fetchall()

    connection.close()

    matches = []

    for candidate in candidates:

        if not candidate["embedding"]:
            continue

        candidate_embedding = np.array(
            json.loads(candidate["embedding"])
        ).reshape(1, -1)

        # -------------------------
        # 1. Semantic score - 60%
        # -------------------------

        semantic_score = calculate_semantic_score(
            job_embedding,
            candidate_embedding
        )

        # -------------------------
        # 2. Skill score - 30%
        # -------------------------

        skill_score = calculate_skill_score(
            candidate["resume_text"],
            skills
        )

        # -------------------------
        # 3. Keyword score - 10%
        # -------------------------

        keyword_score = calculate_keyword_score(
            candidate["resume_text"],
            keywords
        )

        # -------------------------
        # Final score
        # -------------------------

        final_score = (
            semantic_score * 0.60
            + skill_score * 0.30
            + keyword_score * 0.10
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

    # Highest score first
    matches.sort(
        key=lambda candidate: candidate["match_score"],
        reverse=True
    )

    return matches[:top_n]