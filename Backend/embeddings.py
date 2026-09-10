import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

MODEL = "gemini-embedding-001"
DIMENSIONS = 768

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def create_embedding(text: str):
    if not text:
        raise ValueError("Text cannot be empty")

    response = client.models.embed_content(
        model=MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            output_dimensionality=DIMENSIONS,
            task_type="SEMANTIC_SIMILARITY",
        ),
    )

    return response.embeddings[0].values