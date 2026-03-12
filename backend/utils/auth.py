from fastapi import HTTPException, Header
from supabase import create_client
from config import get_settings
import httpx


async def verify_token(authorization: str = Header(...)) -> str:
    """Verify Supabase JWT and return user_id."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header.")

    token = authorization.replace("Bearer ", "")
    settings = get_settings()

    try:
        # Use Supabase to verify the token
        sb = create_client(settings.supabase_url, settings.supabase_service_key)
        user = sb.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token.")
        return user.user.id
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
