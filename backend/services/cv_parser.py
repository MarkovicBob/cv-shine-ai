import pdfplumber
import docx
import io
from fastapi import UploadFile, HTTPException


async def parse_cv_file(file: UploadFile) -> str:
    """Parse text from uploaded PDF or DOCX file."""
    # Upload citamo jednom u memoriju; zato pre parsiranja ogranicavamo velicinu na 5 MB.
    content = await file.read()

    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    filename = file.filename or ""
    ext = filename.lower().split(".")[-1]

    if ext == "pdf":
        return _parse_pdf(content)
    elif ext == "docx":
        return _parse_docx(content)
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload PDF or DOCX."
        )


def _parse_pdf(content: bytes) -> str:
    """Extract text from PDF using pdfplumber."""
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            pages = []
            # PDF moze imati vise stranica; tekst spajamo uz prazan red izmedju stranica.
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages.append(text.strip())
            full_text = "\n\n".join(pages)
            # Skenirani PDF obicno nema tekstualni sloj i zahtevao bi poseban OCR servis.
            if not full_text.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Could not extract text from PDF. Make sure it's not a scanned image."
                )
            return full_text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")


def _parse_docx(content: bytes) -> str:
    """Extract text from DOCX using python-docx."""
    try:
        doc = docx.Document(io.BytesIO(content))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        full_text = "\n".join(paragraphs)
        if not full_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from DOCX file.")
        return full_text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse DOCX: {str(e)}")
