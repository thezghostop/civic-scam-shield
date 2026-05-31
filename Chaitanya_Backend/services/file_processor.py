import fitz  # PyMuPDF
import docx
import io
from services.ocr import run_ocr


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Route file to the correct extractor based on extension."""
    ext = filename.lower().split(".")[-1]

    extractors = {
        "pdf": extract_from_pdf,
        "docx": extract_from_docx,
        "txt": extract_from_txt,
        "png": run_ocr,
        "jpg": run_ocr,
        "jpeg": run_ocr,
        "bmp": run_ocr,
        "tiff": run_ocr,
    }

    extractor = extractors.get(ext)
    if not extractor:
        return file_bytes.decode("utf-8", errors="ignore")

    return extractor(file_bytes)


def extract_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF. Falls back to OCR on image-only pages."""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages_text = []
        for page in doc:
            text = page.get_text().strip()
            if text:
                pages_text.append(text)
            else:
                # Image-only page — render and OCR it
                pix = page.get_pixmap(dpi=200)
                img_bytes = pix.tobytes("png")
                ocr_text = run_ocr(img_bytes)
                if ocr_text.strip():
                    pages_text.append(ocr_text)
        return "\n\n".join(pages_text)
    except Exception as e:
        return f"[PDF extraction error: {e}]"


def extract_from_docx(file_bytes: bytes) -> str:
    """Extract all paragraph text from a .docx file."""
    try:
        document = docx.Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in document.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
    except Exception as e:
        return f"[DOCX extraction error: {e}]"


def extract_from_txt(file_bytes: bytes) -> str:
    """Decode plain text files."""
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return file_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue
    return file_bytes.decode("utf-8", errors="replace")
