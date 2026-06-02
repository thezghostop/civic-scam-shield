# Spec — Civic Scam Shield

## Problem

Digital scams targeting Indian citizens are surging. Victims receive fraudulent government notices, fake job offers, UPI fraud messages, phishing links, and lottery scams via SMS, WhatsApp, email, and printed documents. Most citizens — especially older or less digitally literate ones — cannot reliably identify these threats.

There is no accessible, multilingual tool that lets an ordinary Indian citizen quickly verify whether a message, document, or QR code is a scam.

---

## Goal

Build a web app where any citizen can paste a suspicious message, upload a document or screenshot, or scan a QR code — and instantly receive a clear, trustworthy verdict on whether it is a scam, along with actionable guidance in their language.

---

## Users

| User | Description |
|------|-------------|
| Primary | Urban/semi-urban Indian citizen who received a suspicious message and wants a quick check |
| Secondary | Elderly or low-digital-literacy user assisted by a family member |
| Tertiary | NGO or government helpdesk staff triaging bulk complaints |

---

## User Stories

### Text / Document Analysis
- As a user, I can paste suspicious text (SMS, email, WhatsApp message) and get an instant scam verdict.
- As a user, I can upload a PDF, DOCX, or TXT file (e.g., a fake government notice) and have it analyzed.
- As a user, I can upload an image (screenshot of a message) and have the text extracted and analyzed.
- As a user, I receive a risk score (0–100), risk level (LOW / MEDIUM / HIGH / CRITICAL), scam type label, a plain-language summary, a list of red flags, and recommended actions.

### QR Code Scanning
- As a user, I can point my camera at a QR code and have the embedded URL or text analyzed for scam indicators.
- As a user, I can upload an image containing a QR code for offline scanning.

### Multilingual Support
- As a user, I can receive the full analysis in English, Hindi, or Telugu.
- As a user, I can switch language at any time from the top bar without losing my current session.

### Accessibility
- As a user with low vision, I can increase the font size incrementally.
- As a user, I can switch to dark mode for comfortable viewing.

### Trust & Transparency
- As a user, I can see exactly what red flags the AI found, not just a verdict.
- As a user, I can see legitimate indicators if any exist, so the result is balanced.

---

## Out of Scope (v1)

- User accounts or saved history
- Reporting scams to authorities (automated)
- Real-time URL reputation checks (third-party feeds)
- Mobile native app
- Audio/voice input

---

## Success Criteria

- Analysis completes in under 5 seconds for text input.
- Supports files up to 10 MB.
- Works on mobile browsers (responsive layout).
- All three languages (EN / HI / TE) return well-formed, fluent results.
- Risk level is correctly classified as CRITICAL for known scam patterns in manual testing.
