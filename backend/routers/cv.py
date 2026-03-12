from fastapi import APIRouter, UploadFile, File, Depends
from services.cv_parser import parse_cv_file
from utils.auth import verify_token

router = APIRouter(prefix="/cv", tags=["cv"])


@router.post("/parse")
async def parse_cv(
    file: UploadFile = File(...),
    user_id: str = Depends(verify_token),
):
    """Upload and parse a CV file (PDF or DOCX). Returns extracted text."""
    text = await parse_cv_file(file)
    return {
        "text": text,
        "char_count": len(text),
        "filename": file.filename,
    }
