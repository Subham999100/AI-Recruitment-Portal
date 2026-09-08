import json
import os

from dotenv import load_dotenv
from groq import Groq


load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL = "openai/gpt-oss-20b"


def extract_skills_and_keywords(job_description):
    prompt = f"""
Analyze this job description.

Extract:
1. Important technical skills
2. Important keywords

Return ONLY valid JSON in this exact format:

{{
    "skills": ["skill1", "skill2"],
    "keywords": ["keyword1", "keyword2"]
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
        temperature=0
    )

    content = response.choices[0].message.content

    return json.loads(content)