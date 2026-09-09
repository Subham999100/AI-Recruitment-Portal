import os

from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row
from pgvector.psycopg import register_vector


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_db_connection():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is missing from .env")

    connection = psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row
    )

    register_vector(connection)

    return connection