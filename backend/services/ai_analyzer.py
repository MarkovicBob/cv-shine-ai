import json
import re
import anthropic
from config import get_settings
from models.schemas import AnalysisResult, OptimizedCV, SkillsGap, Suggestion, ExperienceItem, EducationItem
from fastapi import HTTPException

settings = get_settings()

SYSTEM_PROMPT = """You are a world-class ATS optimization expert and professional CV writer with 15 years of experience.
Your task is to analyze the candidate's CV against the job posting and return a JSON object.

Rules:
1. Extract ALL keywords, required skills, tools, certifications, and exact phrases from the job description
2. Identify which keywords are present and missing in the CV
3. Rewrite EVERY section of the CV to naturally integrate ALL missing keywords
4. Mirror the exact terminology and language used in the job posting
5. Quantify ALL achievements with specific metrics (numbers, percentages, timeframes)
6. Reorder skills to exactly match the priority of the job description
7. The optimized CV MUST score 100/100 on ATS systems - include every single keyword
8. Enhance the professional summary to directly address every key requirement
9. Return ONLY valid JSON with no markdown, no code fences, no extra text whatsoever

Return this EXACT JSON structure:
{
  "ats_score": <integer 0-100, score of ORIGINAL cv>,
  "missing_keywords": ["keyword1", "keyword2"],
  "matched_keywords": ["keyword1", "keyword2"],
  "skills_gap": {
    "missing": ["skill1", "skill2"],
    "matched": ["skill1", "skill2"]
  },
  "suggestions": [
    {"section": "Summary", "suggestion": "what to improve"}
  ],
  "job_title": "extracted job title",
  "company": "extracted company name or null",
  "optimized_cv": {
    "name": "candidate full name",
    "email": "email",
    "phone": "phone",
    "location": "city, country",
    "linkedin": "linkedin url or empty string",
    "summary": "powerful 4-5 sentence summary targeting this exact job",
    "experience": [
      {
        "title": "job title",
        "company": "company name",
        "dates": "start - end",
        "bullets": ["achievement with metrics", "achievement with metrics"]
      }
    ],
    "education": [
      {
        "degree": "degree and field",
        "school": "institution name",
        "dates": "year or range"
      }
    ],
    "skills": ["skill1", "skill2"],
    "certifications": ["cert1", "cert2"]
  }
}"""


def analyze_cv(cv_text: str, job_description: str) -> AnalysisResult:
    """Call Anthropic Claude to analyze CV against job description."""
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=500, detail="Anthropic API key not configured.")

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    user_message = f"""Here is the candidate's CV:

{cv_text}

---

Here is the job description:

{job_description}

Analyze the CV against the job description and return the JSON object as specified."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=4000,
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": user_message},
            ],
        )
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=500, detail="Invalid Anthropic API key.")
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="Anthropic rate limit reached. Please try again shortly.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Anthropic API error: {str(e)}")

    content = response.content[0].text if response.content else ""

    # Strip markdown fences if present
    cleaned = content.strip()
    cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
    cleaned = re.sub(r"\n?```$", "", cleaned)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {str(e)}")

    try:
        optimized_cv_data = data.get("optimized_cv", {})
        experience = [ExperienceItem(**exp) for exp in optimized_cv_data.get("experience", [])]
        education = [EducationItem(**edu) for edu in optimized_cv_data.get("education", [])]
        optimized_cv = OptimizedCV(
            name=optimized_cv_data.get("name", ""),
            email=optimized_cv_data.get("email", ""),
            phone=optimized_cv_data.get("phone", ""),
            location=optimized_cv_data.get("location", ""),
            linkedin=optimized_cv_data.get("linkedin", ""),
            summary=optimized_cv_data.get("summary", ""),
            experience=experience,
            education=education,
            skills=optimized_cv_data.get("skills", []),
            certifications=optimized_cv_data.get("certifications", []),
        )
        skills_gap_data = data.get("skills_gap", {})
        skills_gap = SkillsGap(
            missing=skills_gap_data.get("missing", []),
            matched=skills_gap_data.get("matched", []),
        )
        suggestions = [Suggestion(**s) for s in data.get("suggestions", [])]

        return AnalysisResult(
            ats_score=int(data.get("ats_score", 0)),
            missing_keywords=data.get("missing_keywords", []),
            matched_keywords=data.get("matched_keywords", []),
            skills_gap=skills_gap,
            suggestions=suggestions,
            optimized_cv=optimized_cv,
            job_title=data.get("job_title"),
            company=data.get("company"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
