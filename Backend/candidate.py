from fastapi import HTTPException
from Backend.database import get_db_connection


def get_user_candidates(user_id):
    connection = get_db_connection()

    try:
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

    finally:
        connection.close()


def get_candidate(candidate_id, user_id):
    connection = get_db_connection()

    try:
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

    finally:
        connection.close()


def delete_candidate(candidate_id, user_id):
    connection = get_db_connection()

    try:
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

    finally:
        connection.close()