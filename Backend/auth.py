import bcrypt
import os

from jose import JWTError, jwt

from Backend.database import get_db_connection


SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY is missing from .env")
ALGORITHM = "HS256"


# -------------------------
# Create Users Table
# -------------------------

def create_users_table():
    with get_db_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        connection.commit()


# -------------------------
# Register
# -------------------------

def register_user(name: str, email: str, password: str):
    email = email.strip().lower()

    with get_db_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            "SELECT id FROM users WHERE email = %s",
            (email,)
        )

        if cursor.fetchone():
            raise ValueError("Email already registered")

        password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        cursor.execute(
            """
            INSERT INTO users (name, email, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (name, email, password_hash)
        )

        user_id = cursor.fetchone()["id"]

        connection.commit()

    return {
        "user_id": user_id,
        "name": name,
        "email": email
    }


# -------------------------
# Login
# -------------------------

def login_user(email: str, password: str):
    email = email.strip().lower()

    with get_db_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT id, name, email, password_hash
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

    if not user:
        raise ValueError("Invalid email or password")

    password_valid = bcrypt.checkpw(
        password.encode("utf-8"),
        user["password_hash"].encode("utf-8")
    )

    if not password_valid:
        raise ValueError("Invalid email or password")

    token = jwt.encode(
        {
            "user_id": user["id"],
            "email": user["email"]
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user["id"],
        "name": user["name"],
        "email": user["email"]
    }   

# -------------------------
# Get Current User
# -------------------------

def get_current_user(token: str):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise ValueError("Invalid token")

        with get_db_connection() as connection:
            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT id, name, email
                FROM users
                WHERE id = %s
                """,
                (user_id,)
            )

            user = cursor.fetchone()

        if not user:
            raise ValueError("User not found")

        return user

    except JWTError:
        raise ValueError("Invalid or expired token")