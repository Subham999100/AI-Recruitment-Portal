import json
import os
from typing import Optional, Dict, Any

from dotenv import load_dotenv
from groq import Groq


load_dotenv()

MODEL = "openai/gpt-oss-20b"


def get_groq_client(api_key: Optional[str] = None) -> Groq:
    key = api_key or os.getenv("GROQ_API_KEY")

    if not key:
        raise ValueError(
            "GROQ_API_KEY is missing. Please set it in your .env file."
        )

    return Groq(api_key=key.strip())


def extract_skills_and_keywords(
    job_description: str,
    api_key: Optional[str] = None
) -> Dict[str, Any]:

    client = get_groq_client(api_key)

    prompt = f"""
Analyze the following job description.

Extract:

1. Important technical skills
2. Important keywords

Rules:
- Return only skills and keywords relevant to the job.
- Do not invent skills that are not mentioned or clearly implied.
- Keep skills concise.
- Avoid duplicate items.
- Return valid JSON only.

Return exactly this format:

{{
    "skills": ["Python", "FastAPI", "PostgreSQL"],
    "keywords": ["REST APIs", "backend development", "AWS"]
}}

Job Description:
{job_description}
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0,
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content

    result = json.loads(content)

    return {
        "skills": result.get("skills", []),
        "keywords": result.get("keywords", [])
    }