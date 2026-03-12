from fastapi import APIRouter, Depends
from fastapi.responses import Response
from models.schemas import GeneratePdfRequest
from services.pdf_generator import generate_pdf
from utils.auth import verify_token

router = APIRouter(prefix="/pdf", tags=["pdf"])


@router.post("/generate")
async def generate_pdf_endpoint(
    body: GeneratePdfRequest,
    user_id: str = Depends(verify_token),
):
    """Generate ATS-safe PDF from optimized CV data using ReportLab."""
    pdf_bytes = generate_pdf(body.optimized_cv)

    filename = f"optimized-cv-{body.optimized_cv.name or 'cv'}.pdf"
    filename = filename.replace(" ", "-").lower()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )
