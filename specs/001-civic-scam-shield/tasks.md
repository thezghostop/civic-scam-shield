# Tasks — Civic Scam Shield

## Status Key
- [ ] pending
- [x] completed

---

## Phase 1 — Backend Core

- [x] **T01** Set up FastAPI project structure (`main.py`, `routes/`, `services/`)
- [x] **T02** Implement `/analyze` endpoint with input validation (file + text, language param)
- [x] **T03** Implement `file_processor.py` — route PDF / DOCX / TXT to correct extractor
- [x] **T04** Implement `ocr.py` — Tesseract wrapper with `eng+hin` fallback
- [x] **T05** Implement `gemini_service.py` — text analysis via Gemini 2.5 Flash
- [x] **T06** Implement `analyze_scam_image()` — image sent directly to Gemini Vision (no OCR)
- [x] **T07** Add CORS middleware allowing localhost + `*.vercel.app`
- [x] **T08** Add `.env` support via `python-dotenv`; validate `GEMINI_API_KEY` on startup
- [x] **T09** Add file size cap (10 MB) and extension allowlist enforcement
- [x] **T10** Add multilingual prompt templates (EN / HI / TE / auto-detect)

## Phase 2 — Frontend Core

- [x] **T11** Bootstrap Next.js 14 project with TypeScript + Tailwind CSS
- [x] **T12** Build `UploadForm` component — text area + file drag-and-drop
- [x] **T13** Build `ResultCard` component — verdict, risk meter, flags, recommendations
- [x] **T14** Integrate `/analyze` API call with `FormData` and error handling
- [x] **T15** Add language switcher (EN / HI / TE) wired to `language` form param
- [x] **T16** Implement `lib/translations.ts` — all UI strings in three languages
- [x] **T17** Add dark mode toggle (persisted via `documentElement` class)
- [x] **T18** Add font scale control (A- / A+) for accessibility

## Phase 3 — QR Scanner

- [x] **T19** Build `QRScanner` component — request camera permission, stream to `<canvas>`
- [x] **T20** Integrate `jsQR` to decode frames in real time
- [x] **T21** On successful decode, pass QR text to `handleAnalyze` (reuse analysis flow)
- [x] **T22** Support QR image upload as fallback (draw to canvas, decode once)

## Phase 4 — Deployment

- [x] **T23** Add `Procfile` for Railway / Render: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [x] **T24** Add `nixpacks.toml` to install `tesseract` system package on Render
- [x] **T25** Add `render.yaml` blueprint for one-click Render deploy
- [x] **T26** Add `vercel.json` for Next.js framework hint
- [x] **T27** Set `NEXT_PUBLIC_API_URL` env var on Vercel pointing to Render backend
- [x] **T28** Set `GEMINI_API_KEY` env var on Render
- [x] **T29** Smoke test: submit known scam text → verify CRITICAL response end-to-end

## Phase 5 — Polish (optional / future)

- [ ] **T30** Add loading skeleton animation while analysis runs
- [ ] **T31** Add share / copy result button on `ResultCard`
- [ ] **T32** Add `/health` endpoint on backend for uptime monitoring
- [ ] **T33** Add rate limiting (e.g., 20 req/min per IP) to prevent API key abuse
- [ ] **T34** Write unit tests for `file_processor.py` and `gemini_service.py`
- [ ] **T35** Add Telugu (`tel`) Tesseract language pack for OCR fallback
