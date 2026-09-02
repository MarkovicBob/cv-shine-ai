# pyright: reportMissingImports=false
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class AnalyzeRequest(BaseModel):
    cv_text: str
    job_description: str
    user_id: str


class ExperienceItem(BaseModel):
    title: str
    company: str
    dates: str
    bullets: List[str]


class EducationItem(BaseModel):
    degree: str
    school: str
    dates: str


class OptimizedCV(BaseModel):
    name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    linkedin: Optional[str] = ""
    summary: Optional[str] = ""
    experience: Optional[List[ExperienceItem]] = []
    education: Optional[List[EducationItem]] = []
    skills: Optional[List[str]] = []
    certifications: Optional[List[str]] = []


class SkillsGap(BaseModel):
    missing: List[str] = []
    matched: List[str] = []


class Suggestion(BaseModel):
    section: str
    suggestion: str


class AnalysisResult(BaseModel):
    ats_score: int
    missing_keywords: List[str] = []
    matched_keywords: List[str] = []
    skills_gap: SkillsGap
    suggestions: List[Suggestion] = []
    optimized_cv: OptimizedCV
    job_title: Optional[str] = None
    company: Optional[str] = None


class GeneratePdfRequest(BaseModel):
    optimized_cv: OptimizedCV
    user_id: str


class SaveAnalysisRequest(BaseModel):
    user_id: str
    job_title: Optional[str] = None
    company: Optional[str] = None
    original_score: int
    optimized_score: int = 100
    cv_text: str
    job_description: str
    optimized_cv: Any
    suggestions: Any
    missing_keywords: List[str] = []
    matched_keywords: List[str] = []
