import pytesseract
from PIL import Image
import io
import os

# Windows: point to Tesseract installation if not in PATH
if os.name == "nt":
    tesseract_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = tesseract_path


def run_ocr(image_bytes: bytes) -> str:
    """
    Run Tesseract OCR on image bytes.
    Uses English + Hindi language packs for Indian content.
    Falls back to English-only if Hindi pack not installed.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))

        # Convert to RGB if needed (handles RGBA PNGs etc.)
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")

        try:
            # Try with Hindi support first (useful for India-targeted scams)
            text = pytesseract.image_to_string(image, lang="eng+hin")
        except pytesseract.TesseractError:
            text = pytesseract.image_to_string(image, lang="eng")

        return text.strip()
    except Exception as e:
        return f"[OCR error: {e}]"
