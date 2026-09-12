from fastapi import HTTPException
from Backend.database import get_db_connection


def get_user_candidates(user_id):
    with get_db_connection() as connection:
        candidates = connection.execute(
            """
            SELECT
                id,
                name,
                email,
                resume_filename,
                created_at
            FROM candidates
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,)
        ).fetchall()

        return candidates


def get_candidate(candidate_id, user_id):
    with get_db_connection() as connection:
        candidate = connection.execute(
            """
            SELECT
                id,
                name,
                email,
                resume_filename,
                resume_text,
                created_at
            FROM candidates
            WHERE id = %s
              AND user_id = %s
            """,
            (candidate_id, user_id)
        ).fetchone()

        if candidate is None:
            raise HTTPException(
                status_code=404,
                detail="Candidate not found"
            )

        return candidate


def delete_candidate(candidate_id, user_id):
    with get_db_connection() as connection:
        result = connection.execute(
            """
            DELETE FROM candidates
            WHERE id = %s
              AND user_id = %s
            RETURNING id
            """,
            (candidate_id, user_id)
        ).fetchone()

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Candidate not found"
            )

        connection.commit()

        return {
            "message": "Candidate deleted successfully",
            "candidate_id": candidate_id
        }