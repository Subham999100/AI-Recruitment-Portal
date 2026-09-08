import json
import os
import re
from typing import Optional, Dict, Any

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

DEFAULT_MODEL = "llama-3.3-70b-versatile"
FALLBACK_MODEL = "llama-3.1-8b-instant"


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

        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        return json.loads(content)

    except Exception as e:
        # Graceful fallback: basic regex extractor if Groq key isn't active
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
        focus_guideline = "Focus on enterprise architecture, technical strategy, cross-team alignment, mitigating high-stakes technical debt, scalability bottlenecks, and mentorship."
    elif exp_years >= 5:
        exp_tier = "Senior (5-8 Yrs)"
        focus_guideline = "Focus on advanced system design, failure-mode resiliency, trade-off evaluation, code maintainability, and end-to-end technical leadership."
    elif exp_years >= 3:
        exp_tier = "Mid-Level (3-5 Yrs)"
        focus_guideline = "Focus on clean code architecture, practical API design, debugging difficult production issues, and autonomous feature delivery."
    else:
        exp_tier = "Junior (0-2 Yrs)"
        focus_guideline = "Focus on core computer science foundations, structured problem-solving, clean coding mechanics, debugging grit, and learning velocity."

    system_prompt = f"""You are an elite Principal Technical Recruiter and Engineering Bar Raiser.
Your task is to generate a comprehensive, highly personalized technical interview kit for a candidate.

Target Role: {job_title}
Candidate Name: {candidate_name}
Experience Level: {candidate_experience} Years ({exp_tier})

Seniority Calibration Guideline:
{focus_guideline}

Instructions:
1. Compare the Candidate's Resume against the Job Description.
2. Identify both strong overlaps and critical skill gaps or stretch areas.
3. Formulate 4 to 6 razor-sharp, non-generic interview questions across four key categories:
   - "JD Technical": Deep-dive into technical requirements specified in the JD.
   - "Resume Deep-Dive": Scrutinize specific project claims and metrics on the candidate's resume.
   - "Experience & Architecture": Calibrated precisely to their {candidate_experience} years of experience.
   - "Behavioral & Leadership": Real-world situations assessing collaboration, trade-offs, and communication.
4. For EACH question, provide:
   - "id": unique string (e.g. "groq-q1")
   - "category": one of ["JD Technical", "Resume Deep-Dive", "Experience & Architecture", "Behavioral & Leadership"]
   - "difficulty": "{exp_tier}"
   - "question": clear, nuanced, conversational question text.
   - "rationale": explanation of why this question is being asked based on the JD or resume.
   - "whatToLookFor": array of 3 specific bullet points indicating strong answers vs weak answers.
   - "followUpProbe": a sharp follow-up question to probe deeper.
5. Provide a "matchedScore" (integer 0-100) and an executive "summary" (2-3 sentences).

Return ONLY valid JSON matching this schema:
{{
  "jobTitle": "{job_title}",
  "candidateName": "{candidate_name}",
  "candidateExperience": {candidate_experience},
  "matchedScore": 85,
  "summary": "Executive calibration summary...",
  "questions": [
    {{
      "id": "groq-q1",
      "category": "JD Technical",
      "difficulty": "{exp_tier}",
      "question": "Question text...",
      "rationale": "Why this question...",
      "whatToLookFor": ["Point 1", "Point 2", "Point 3"],
      "followUpProbe": "Follow-up question..."
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

    chosen_model = model if model in [DEFAULT_MODEL, FALLBACK_MODEL, "mixtral-8x7b-32768"] else DEFAULT_MODEL

    try:
        response = client.chat.completions.create(
            model=chosen_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
    except Exception:
        # Fallback to faster instant model if primary model hits rate limit or error
        response = client.chat.completions.create(
            model=FALLBACK_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )

    content = response.choices[0].message.content
    data = json.loads(content)
    return data