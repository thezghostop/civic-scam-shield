# Plan — Civic Scam Shield

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Next.js 14 (App Router) + TypeScript | SSR-ready, fast, easy Vercel deploy |
| Styling | Tailwind CSS | Rapid responsive UI, dark mode trivial |
| QR Scanning | jsQR (client-side) | No server round-trip for QR decode |
| Backend | FastAPI (Python) | Async, fast, great for ML/AI pipelines |
| AI Engine | Gemini 2.5 Flash | Multimodal (text + vision), multilingual |
| OCR | Tesseract via pytesseract | Fallback for non-image PDFs |
| PDF Parsing | PyMuPDF (fitz) | Fast, reliable text + image page extraction |
| DOCX Parsing | python-docx | Standard .docx extraction |
| Deployment | Vercel (frontend) + Render (backend) | Free tier, auto-scale |

---

## Architecture

```
Browser
  │
  ├─ Text / File Upload ──► POST /analyze ──► FastAPI
  │                                               │
  └─ QR Scan (jsQR) ──► decoded text ────────────┤
                                                  │
                                          file_processor.py
                                          (PDF/DOCX/TXT/OCR)
                                                  │
                                          gemini_service.py
                                          (Gemini 2.5 Flash)
                                                  │
                                          JSON response ◄──────── Browser renders ResultCard
```

### API Contract

**POST /analyze**

| Field | Type | Notes |
|-------|------|-------|
| `file` | multipart (optional) | PDF, DOCX, TXT, PNG, JPG, BMP, TIFF ≤ 10 MB |
| `text` | form string (optional) | Raw text if no file |
| `language` | form string | `en` / `hi` / `te` / `auto` |

**Response JSON**

```json
{
  "is_scam": true,
  "risk_level": "CRITICAL",
  "risk_score": 92,
  "scam_type": "Government Impersonation",
  "summary": "...",
  "red_flags": ["..."],
  "recommendations": ["..."],
  "legitimate_indicators": []
}
```

---

## Component Breakdown

### Frontend

| Component | Responsibility |
|-----------|---------------|
| `app/page.tsx` | Shell: tabs, dark mode, font scale, language switcher |
| `UploadForm.tsx` | Text area + file drop zone, calls `onAnalyze` |
| `ResultCard.tsx` | Renders verdict, risk meter, flags, recommendations |
| `QRScanner.tsx` | Camera stream + jsQR decode, passes text to `onAnalyze` |
| `lib/translations.ts` | All UI strings in EN / HI / TE |

### Backend

| Module | Responsibility |
|--------|---------------|
| `main.py` | FastAPI app, CORS config |
| `routes/analyze.py` | Input validation, file routing, response |
| `services/file_processor.py` | Routes to PDF / DOCX / TXT / OCR extractor |
| `services/ocr.py` | Tesseract wrapper with Hindi fallback |
| `services/gemini_service.py` | Gemini API calls — text analysis + image vision |

---

## Environment Variables

| Variable | Where set | Purpose |
|----------|-----------|---------|
| `GEMINI_API_KEY` | Render → Environment | Authenticates Gemini API |
| `NEXT_PUBLIC_API_URL` | Vercel → Environment | Points frontend at backend URL |

---

## CORS Policy

Backend allows:
- `http://localhost:3000` (dev)
- `https://*.vercel.app` (prod)

---

## Security Notes

- File size capped at 10 MB server-side.
- Only allowlisted extensions accepted (`pdf`, `docx`, `txt`, `png`, `jpg`, `jpeg`, `bmp`, `tiff`).
- No file storage — content processed in memory only.
- API key stored in environment, never exposed to client.
