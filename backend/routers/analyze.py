from fastapi import APIRouter, Depends, HTTPException
from models.schemas import AnalyzeRequest, AnalysisResult, SaveAnalysisRequest
from services.ai_analyzer import analyze_cv
from services.supabase_service import check_rate_limit, increment_analyses_count, save_analysis
from utils.auth import verify_token

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("", response_model=AnalysisResult)
async def analyze_endpoint(
    body: AnalyzeRequest,
    user_id: str = Depends(verify_token),
):
    """Analyze CV against job description using OpenAI GPT-4o."""
    # Verify user_id matches token
    if body.user_id != user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch.")

    # Check rate limit
    if not check_rate_limit(user_id):
        raise HTTPException(
            status_code=429,
            detail="Free tier limit reached (3 analyses/month). Upgrade to Pro."
        )

    # Run AI analysis
    result = analyze_cv(body.cv_text, body.job_description)

    # Save to database
    save_analysis(SaveAnalysisRequest(
        user_id=user_id,
        job_title=result.job_title,
        company=result.company,
        original_score=result.ats_score,
        optimized_score=100,
        cv_text=body.cv_text,
        job_description=body.job_description,
        optimized_cv=result.optimized_cv.model_dump(),
        suggestions=[s.model_dump() for s in result.suggestions],
        missing_keywords=result.missing_keywords,
        matched_keywords=result.matched_keywords,
    ))

    # Increment usage counter
    increment_analyses_count(user_id)

    return result
