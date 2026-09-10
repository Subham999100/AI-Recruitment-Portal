import json

from Backend.llm import get_groq_client, MODEL


def evaluate_candidate(job_description, resume_text):
    prompt = f"""
You are an expert technical recruiter.

Evaluate the candidate against the job description.

IMPORTANT RULES:
- Use ONLY information explicitly supported by the resume.
- Do NOT assume a skill or experience that is not present.
- Do NOT invent projects, years of experience, technologies, education, or achievements.
- If evidence is missing, treat it as missing.
- Give higher scores when the resume provides strong direct evidence.
- Return ONLY valid JSON.

JOB DESCRIPTION:
{job_description}

CANDIDATE RESUME:
{resume_text}

Evaluate the candidate using these categories:

1. required_skills
2. experience_relevance
3. technical_depth
4. project_relevance
5. education_certifications

Return exactly this JSON structure:

{{
    "overall_score": 0,
    "required_skills_score": 0,
    "experience_relevance_score": 0,
    "technical_depth_score": 0,
    "project_relevance_score": 0,
    "education_certifications_score": 0,
    "strengths": [],
    "gaps": [],
    "evidence": [],
    "recommendation": "strong_match"
}}

Scores must be between 0 and 100.

recommendation must be one of:
- "strong_match"
- "good_match"
- "partial_match"
- "weak_match"
"""

    client = get_groq_client()

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a precise recruitment evaluation engine."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0,
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        raise ValueError("LLM returned invalid JSON")