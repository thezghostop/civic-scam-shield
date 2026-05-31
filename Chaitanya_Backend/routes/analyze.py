from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from services.file_processor import extract_text
from services.gemini_service import analyze_scam, analyze_scam_image

router = APIRouter()

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "png", "jpg", "jpeg", "bmp", "tiff"}
IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "bmp", "tiff"}
MAX_FILE_SIZE_MB = 10
ALLOWED_LANGUAGES = {"en", "hi", "te", "auto"}


@router.post("/analyze")
async def analyze(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    language: Optional[str] = Form("en"),
):
    if not file and not text:
        raise HTTPException(status_code=400, detail="Provide either a file or text input.")

    if language not in ALLOWED_LANGUAGES:
        language = "en"

    if file:
        ext = file.filename.lower().split(".")[-1]
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '.{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        content = await file.read()

        if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File too large. Max size: {MAX_FILE_SIZE_MB}MB")

        # For images: send directly to Gemini vision (much more reliable than OCR)
        if ext in IMAGE_EXTENSIONS:
            mime_type = f"image/{'jpeg' if ext in ('jpg', 'jpeg') else ext}"
            result = analyze_scam_image(content, mime_type, language=language)
            return result

        # For PDFs, DOCX, TXT: extract text first
        extracted_text = extract_text(content, file.filename)

        if not extracted_text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from the file.")
    else:
        extracted_text = text.strip()

    if len(extracted_text) < 10:
        raise HTTPException(status_code=422, detail="Content is too short to analyze.")

    result = analyze_scam(extracted_text, language=language)
    return result
