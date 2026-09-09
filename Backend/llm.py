import json
import os
import re
from typing import Optional, Dict, Any, List

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

DEFAULT_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
SUPPORTED_MODELS = [
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
]


def get_groq_client(api_key: Optional[str] = None) -> Groq:
    """
    Returns an authenticated Groq client instance.
    Prioritizes passed api_key, then GROQ_API_KEY environment variable.
    """
    key = api_key or os.getenv("GROQ_API_KEY")
    if not key or key.strip() == "":
        raise ValueError(
            "Groq API key is missing. Please provide it in the request or set GROQ_API_KEY in your .env file."
        )
    return Groq(api_key=key.strip())


def get_available_models(client: Groq) -> List[str]:
    """
    Query Groq for models currently available to this API key.
    """
    try:
        data = client.models.list().data
        return [m.id for m in data]
    except Exception:
        return SUPPORTED_MODELS


def extract_skills_and_keywords(job_description: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Extract technical skills and keywords from a job description using Groq LLM.
    Falls back to regex extraction if no Groq API key is configured.
    """
    try:
        client = get_groq_client(api_key)
        prompt = f"""Analyze this job description.

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
        models_to_try = [DEFAULT_MODEL, "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
        response = None
        for mod in models_to_try:
            try:
                response = client.chat.completions.create(
                    model=mod,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                    response_format={"type": "json_object"}
                )
                break
            except Exception:
                continue

        if response:
            content = response.choices[0].message.content
            return json.loads(content)
        raise RuntimeError("No model responded")

    except Exception:
        # Graceful fallback: basic regex extractor
        common_tech = [
            "python", "react", "fastapi", "typescript", "javascript", "docker", 
            "kubernetes", "aws", "sql", "postgresql", "mongodb", "node", "ci/cd",
            "git", "machine learning", "rest api", "graphql", "tailwind"
        ]
        jd_lower = job_description.lower()
        found_skills = [s for s in common_tech if s in jd_lower]
        words = re.findall(r'\b[A-Za-z]{3,}\b', job_description)
        keywords = list(set([w for w in words if w.isupper() or len(w) > 6]))[:10]

        return {
            "skills": found_skills or ["general engineering", "problem solving"],
            "keywords": keywords or ["collaboration", "architecture", "development"]
        }


def generate_interview_kit_llm(
    job_title: str,
    job_description: str,
    candidate_name: str,
    candidate_resume: str,
    candidate_experience: float,
    api_key: Optional[str] = None,
    model: str = DEFAULT_MODEL
) -> Dict[str, Any]:
    """
    Generate an in-depth, calibrated interview kit using Groq LLM.
    Calibrates questions by comparing candidate resume, job description, and years of experience.
    """
    client = get_groq_client(api_key)

    exp_years = float(candidate_experience)
    if exp_years >= 8:
        exp_tier = "Lead / Architect (8+ Yrs)"
        difficulty = "Expert"
        focus_guideline = "Focus on enterprise architecture, scaling bottlenecks, technical governance, and cross-team trade-offs."
    elif exp_years >= 5:
        exp_tier = "Senior (5-8 Yrs)"
        difficulty = "Advanced"
        focus_guideline = "Focus on system design, failure resiliency, performance profiling, and production code maintainability."
    elif exp_years >= 3:
        exp_tier = "Mid-Level (3-5 Yrs)"
        difficulty = "Intermediate"
        focus_guideline = "Focus on modular component architecture, robust API design, debugging edge cases, and feature autonomy."
    else:
        exp_tier = "Junior (0-2 Yrs)"
        difficulty = "Beginner"
        focus_guideline = "Focus on fundamental data structures, coding syntax, core algorithms, and practical debugging basics."

    difficulty_badge = f"{difficulty} ({candidate_experience} Yrs Exp)"

    system_prompt = f"""You are a Principal Engineering Recruiter and Technical Bar Raiser.
Your task is to generate concise, highly calibrated technical interview questions.

Target Role: {job_title}
Candidate Name: {candidate_name}
Experience Level: {candidate_experience} Years
Calibrated Difficulty: {difficulty_badge}

Seniority Guideline:
{focus_guideline}

STRICT CONSTRAINTS (MUST FOLLOW):
1. QUESTION LENGTH: Each question MUST BE STRICTLY 1 OR 2 LINES (maximum 20-30 words). Never output lengthy paragraphs, multi-sentence setups, or compound multi-part prompts.
2. DIFFICULTY CALIBRATION: The difficulty and question depth must strictly match the candidate's experience tier: {difficulty_badge}.
3. Generate 4 sharp, high-signal questions across categories:
   - "JD Technical": 1-2 line question on core technologies from the JD.
   - "Resume Deep-Dive": 1-2 line question on claims/projects from the candidate's resume.
   - "Experience & Architecture": 1-2 line question calibrated directly for {candidate_experience} years of experience ({difficulty}).
   - "Behavioral & Leadership": 1-2 line question on technical trade-offs, collaboration, or ownership.

Return ONLY valid JSON matching this schema:
{{
  "jobTitle": "{job_title}",
  "candidateName": "{candidate_name}",
  "candidateExperience": {candidate_experience},
  "matchedScore": 88,
  "summary": "Concise 1-sentence qualification summary.",
  "questions": [
    {{
      "id": "q1",
      "category": "JD Technical",
      "difficulty": "{difficulty_badge}",
      "question": "Concise question text here (strictly 1 or 2 lines)?",
      "rationale": "Short 1-sentence reason for this question.",
      "whatToLookFor": ["Key signal 1", "Key signal 2"],
      "followUpProbe": "Short 1-line follow-up probe?"
    }}
  ]
}}
"""

    user_prompt = f"""Job Title:
{job_title}

Job Description:
{job_description}

Candidate Name:
{candidate_name}

Candidate Experience:
{candidate_experience} years

Candidate Resume / Profile:
{candidate_resume}
"""

    # Build model candidate priority list
    models_to_try = [model] if model else []
    for m in ["openai/gpt-oss-20b", "qwen/qwen3.8-27b", "openai/gpt-oss-120b", "llama-3.3-70b-versatile"]:
        if m not in models_to_try:
            models_to_try.append(m)

    response = None
    last_error = None
    used_model = model

    for mod in models_to_try:
        try:
            response = client.chat.completions.create(
                model=mod,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            used_model = mod
            break
        except Exception as e:
            last_error = e
            continue

    if not response:
        raise RuntimeError(f"All Groq models failed. Last error: {last_error}")

    content = response.choices[0].message.content
    data = json.loads(content)
    data["used_model"] = used_model
    return data