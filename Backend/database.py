import os
import re

import psycopg
from psycopg.rows import dict_row


DATABASE_URL = os.getenv("DATABASE_URL")


class DatabaseConnection:
    def __init__(self, connection):
        self._connection = connection

    @staticmethod
    def _convert_placeholders(query):
        return re.sub(r"\?", "%s", query)

    def execute(self, query, params=None):
        return self._connection.execute(self._convert_placeholders(query), params or ())

    def cursor(self):
        return DatabaseCursor(self._connection.cursor(), self._convert_placeholders)

    def commit(self):
        self._connection.commit()

    def rollback(self):
        self._connection.rollback()

    def close(self):
        self._connection.close()


class DatabaseCursor:
    def __init__(self, cursor, convert_placeholders):
        self._cursor = cursor
        self._convert_placeholders = convert_placeholders

    def execute(self, query, params=None):
        return self._cursor.execute(self._convert_placeholders(query), params or ())

    def fetchone(self):
        return self._cursor.fetchone()

    @property
    def rowcount(self):
        return self._cursor.rowcount


def get_db_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is required for the Aiven PostgreSQL database")
    return DatabaseConnection(psycopg.connect(DATABASE_URL, row_factory=dict_row))


def create_tables():
    connection = get_db_connection()
    statements = [
        """
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'EMPLOYEE' CHECK (role IN ('ADMIN', 'EMPLOYEE')),
            status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            approved_at TIMESTAMPTZ,
            approved_by BIGINT REFERENCES users(id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS candidates (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            resume_filename TEXT NOT NULL,
            resume_text TEXT NOT NULL,
            embedding TEXT,
            status TEXT NOT NULL DEFAULT 'New',
            skills TEXT NOT NULL DEFAULT '[]',
            experience DOUBLE PRECISION NOT NULL DEFAULT 0,
            summary TEXT,
            uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS jobs (
            id BIGSERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            embedding TEXT,
            skills TEXT,
            keywords TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS candidate_matches (
            id BIGSERIAL PRIMARY KEY,
            job_id BIGINT NOT NULL REFERENCES jobs(id),
            candidate_id BIGINT NOT NULL REFERENCES candidates(id),
            match_score DOUBLE PRECISION NOT NULL,
            semantic_score DOUBLE PRECISION NOT NULL,
            skill_score DOUBLE PRECISION NOT NULL,
            keyword_score DOUBLE PRECISION NOT NULL,
            matched_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(job_id, candidate_id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS interview_questions (
            id BIGSERIAL PRIMARY KEY,
            job_id BIGINT NOT NULL REFERENCES jobs(id),
            question TEXT NOT NULL,
            answer TEXT NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'EMPLOYEE' CHECK (role IN ('ADMIN', 'EMPLOYEE')),
            status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            approved_at TIMESTAMPTZ,
            approved_by BIGINT REFERENCES users(id)
        )
        """,
    ]
    try:
        for statement in statements:
            connection.execute(statement)
        connection.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS owner_id BIGINT REFERENCES users(id)")
        connection.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS owner_id BIGINT REFERENCES users(id)")
        connection.execute("CREATE INDEX IF NOT EXISTS candidates_owner_idx ON candidates(owner_id)")
        connection.execute("CREATE INDEX IF NOT EXISTS jobs_owner_idx ON jobs(owner_id)")
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
