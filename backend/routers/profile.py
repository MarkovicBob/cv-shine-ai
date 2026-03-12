from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.supabase_service import get_supabase, get_profile
from utils.auth import verify_token

router = APIRouter(prefix="/profile", tags=["profile"])


class UpdateProfileRequest(BaseModel):
    full_name: str


@router.get("")
async def get_profile_endpoint(user_id: str = Depends(verify_token)):
    """Get current user profile."""
    profile = get_profile(user_id)
    return profile


@router.patch("")
async def update_profile(
    body: UpdateProfileRequest,
    user_id: str = Depends(verify_token),
):
    """Update user's full name."""
    sb = get_supabase()
    sb.table("profiles").update({"full_name": body.full_name}).eq("user_id", user_id).execute()
    return {"message": "Profile updated"}
