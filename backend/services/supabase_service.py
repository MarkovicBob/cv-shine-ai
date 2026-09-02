# pyright: reportMissingImports=false
from supabase import create_client, Client
from config import get_settings
from models.schemas import SaveAnalysisRequest
from fastapi import HTTPException
from functools import lru_cache


@lru_cache()
def get_supabase() -> Client:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_key:
        raise HTTPException(status_code=500, detail="Supabase not configured.")
    return create_client(settings.supabase_url, settings.supabase_service_key)


def get_profile(user_id: str) -> dict:
    sb = get_supabase()
    res = sb.table("profiles").select("*").eq("user_id", user_id).execute()
    if res.data:
        return res.data[0]
    # Profile doesn't exist — auto-create (user registered before trigger was set up)
    new_profile = {"user_id": user_id, "subscription_tier": "free", "analyses_count": 0}
    sb.table("profiles").insert(new_profile).execute()
    return new_profile


def check_rate_limit(user_id: str) -> bool:
    """Returns True if user can still analyze (under limit)."""
    profile = get_profile(user_id)
    tier = profile.get("subscription_tier", "free")
    count = profile.get("analyses_count", 0)
    if tier == "free" and count >= 3:
        return False
    return True


def increment_analyses_count(user_id: str):
    sb = get_supabase()
    profile = get_profile(user_id)
    current = profile.get("analyses_count", 0)
    sb.table("profiles").update({"analyses_count": current + 1}).eq("user_id", user_id).execute()


def save_analysis(data: SaveAnalysisRequest):
    sb = get_supabase()
    payload = {
        "user_id": data.user_id,
        "job_title": data.job_title,
        "company": data.company,
        "original_score": data.original_score,
        "optimized_score": data.optimized_score,
        "cv_text": data.cv_text,
        "job_description": data.job_description,
        "optimized_cv": data.optimized_cv,
        "suggestions": data.suggestions,
        "missing_keywords": data.missing_keywords,
        "matched_keywords": data.matched_keywords,
    }
    res = sb.table("cv_analyses").insert(payload).execute()
    return res.data


def get_user_analyses(user_id: str, limit: int = 50) -> list:
    sb = get_supabase()
    res = (
        sb.table("cv_analyses")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []


def delete_analysis(analysis_id: str, user_id: str):
    sb = get_supabase()
    sb.table("cv_analyses").delete().eq("id", analysis_id).eq("user_id", user_id).execute()
