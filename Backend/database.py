import sqlite3

DATABASE_NAME = "recruitment.db"


def get_db_connection():
    connection = sqlite3.connect(DATABASE_NAME)
    connection.row_factory = sqlite3.Row
    return connection


def create_tables():
    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            resume_filename TEXT NOT NULL,
            resume_text TEXT NOT NULL,
            embedding TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            embedding TEXT,
            skills TEXT,
            keywords TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS interview_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            FOREIGN KEY (job_id) REFERENCES jobs(id)
        )
    """)

    connection.commit()
    connection.close()