from threading import Lock
from typing import Optional

from sentence_transformers import SentenceTransformer


EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

_model: Optional[SentenceTransformer] = None
_model_lock = Lock()


def initialize_embedding_model() -> SentenceTransformer:
    """Load the local embedding model once and reuse it for all requests."""

    global _model

    if _model is None:
        with _model_lock:
            if _model is None:
                _model = SentenceTransformer(EMBEDDING_MODEL)

    return _model


def create_embedding(text: str) -> list[float]:
    """Create a normalized local embedding for a job or resume document."""

    if not text or not text.strip():
        raise ValueError("Cannot create an embedding from empty text.")

    try:
        model = initialize_embedding_model()
        embedding = model.encode(
            text,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
        return embedding.tolist()
    except Exception as exc:
        raise RuntimeError(
            "Local embedding generation failed. Ensure the Sentence Transformers model "
            f"'{EMBEDDING_MODEL}' is available."
        ) from exc
