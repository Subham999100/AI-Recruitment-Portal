import os

from dotenv import load_dotenv
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from pgvector.psycopg import register_vector

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is missing from .env")


def configure_connection(connection):
    """Configure every connection created by the pool."""
    register_vector(connection)


db_pool = ConnectionPool(
    conninfo=DATABASE_URL,
    min_size=2,
    max_size=10,
    kwargs={
        "row_factory": dict_row
    },
    configure=configure_connection,
)


def get_db_connection():
    """Get a connection from the pool."""
    return db_pool.connection()


def close_db_pool():
    """Close the database connection pool."""
    db_pool.close()