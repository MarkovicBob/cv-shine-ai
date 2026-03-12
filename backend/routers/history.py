from fastapi import APIRouter, Depends
from services.supabase_service import get_user_analyses, delete_analysis
from utils.auth import verify_token

router = APIRouter(prefix="/history", tags=["history"])


@router.get("")
async def get_history(user_id: str = Depends(verify_token)):
    """Get all CV analyses for the current user."""
    analyses = get_user_analyses(user_id)
    return {"analyses": analyses}


@router.delete("/{analysis_id}")
async def delete_analysis_endpoint(
    analysis_id: str,
    user_id: str = Depends(verify_token),
):
    """Delete a CV analysis by ID."""
    delete_analysis(analysis_id, user_id)
    return {"message": "Deleted successfully"}
