import os
import json
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY")
if not _api_key:
    raise RuntimeError("GEMINI_API_KEY not set in .env file")

client = genai.Client(api_key=_api_key)

LANGUAGE_INSTRUCTIONS = {
    "en": "Respond entirely in English.",
    "hi": "Respond entirely in Hindi (हिंदी). All fields including summary, red_flags, and recommendations must be in Hindi.",
    "te": "Respond entirely in Telugu (తెలుగు). All fields including summary, red_flags, and recommendations must be in Telugu.",
    "auto": "Detect the language of the input content and respond in that same language. If the content is in Hindi, respond in Hindi. If in Telugu, respond in Telugu. Otherwise respond in English.",
}

SYSTEM_PROMPT = """
You are a scam detection expert specializing in digital fraud targeting Indian citizens.
Your job is to analyze provided content and identify whether it is a scam, phishing attempt,
fake government notice, fraudulent job offer, UPI fraud, lottery fraud, or misinformation.

Always respond ONLY with a valid JSON object — no extra text, no markdown, no code fences.
""".strip()

ANALYSIS_PROMPT = """
{language_instruction}

Analyze the following content for scam indicators. Be thorough and consider Indian-specific fraud patterns.

Content:
\"\"\"
{content}
\"\"\"

Respond with this exact JSON structure:
{{
  "is_scam": <true | false>,
  "risk_level": "<LOW | MEDIUM | HIGH | CRITICAL>",
  "risk_score": <integer 0-100>,
  "scam_type": "<e.g. Phishing, Fake Job Offer, Government Impersonation, UPI Fraud, Lottery Fraud, KYC Fraud, Loan Fraud, Fake Scholarship, Investment Fraud, or null if not a scam>",
  "summary": "<1-2 sentence plain language summary of your finding>",
  "red_flags": [
    "<specific red flag found in the content>",
    "<another red flag>"
  ],
  "recommendations": [
    "<specific action the user should take>",
    "<another action>"
  ],
  "legitimate_indicators": [
    "<if any signs suggest the content might be legitimate, list them here — empty array if none>"
  ]
}}

IMPORTANT: risk_level must be one of exactly: LOW, MEDIUM, HIGH, CRITICAL (always in English/uppercase).
risk_score must be an integer 0-100.
is_scam must be true or false.
All other text fields should be in the requested language.

Risk level guide:
- LOW (0-25): Likely safe, minor concerns
- MEDIUM (26-55): Suspicious, proceed with caution
- HIGH (56-80): Very likely a scam, do not engage
- CRITICAL (81-100): Confirmed scam pattern, take immediate action
"""


def analyze_scam(content: str, language: str = "en") -> dict:
    """Send content to Gemini and return structured scam analysis."""
    truncated = content[:4000]
    if len(content) > 4000:
        truncated += "\n\n[Content truncated for analysis]"

    lang_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["en"])
    prompt = ANALYSIS_PROMPT.format(content=truncated, language_instruction=lang_instruction)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"{SYSTEM_PROMPT}\n\n{prompt}",
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=4096,
            )
        )

        raw = response.text.strip()

        # Extract JSON — handle code fences or raw JSON
        fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
        if fence_match:
            raw = fence_match.group(1)
        else:
            brace_match = re.search(r"\{.*\}", raw, re.DOTALL)
            if brace_match:
                raw = brace_match.group(0)

        result = json.loads(raw.strip())

        # Validate required keys
        required = ["is_scam", "risk_level", "risk_score", "summary", "red_flags", "recommendations"]
        for key in required:
            if key not in result:
                raise ValueError(f"Missing key in response: {key}")

        return result

    except json.JSONDecodeError as e:
        return {
            "error": "AI returned invalid JSON. Please try again.",
            "detail": str(e),
        }
    except Exception as e:
        return {
            "error": f"Analysis failed: {str(e)}"
        }


def _parse_gemini_response(response) -> dict:
    """Shared JSON parser for Gemini responses."""
    raw = response.text.strip()
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
    if fence_match:
        raw = fence_match.group(1)
    else:
        brace_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if brace_match:
            raw = brace_match.group(0)
    result = json.loads(raw.strip())
    required = ["is_scam", "risk_level", "risk_score", "summary", "red_flags", "recommendations"]
    for key in required:
        if key not in result:
            raise ValueError(f"Missing key in response: {key}")
    return result


def analyze_scam_image(image_bytes: bytes, mime_type: str, language: str = "en") -> dict:
    """Send image directly to Gemini vision for scam analysis — no OCR needed."""
    import base64

    lang_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["en"])

    image_prompt = f"""{SYSTEM_PROMPT}

{lang_instruction}

Look at this image carefully. It may be a screenshot of an SMS, email, WhatsApp message, bank notice, job offer, government notification, or any other document.

Read ALL the text visible in the image and analyze it for scam indicators.

Respond with this exact JSON structure:
{{
  "is_scam": <true | false>,
  "risk_level": "<LOW | MEDIUM | HIGH | CRITICAL>",
  "risk_score": <integer 0-100>,
  "scam_type": "<type or null>",
  "summary": "<1-2 sentence summary>",
  "red_flags": ["<flag 1>", "<flag 2>"],
  "recommendations": ["<action 1>", "<action 2>"],
  "legitimate_indicators": ["<indicator or empty array>"]
}}

IMPORTANT: risk_level must be LOW, MEDIUM, HIGH, or CRITICAL in uppercase. risk_score must be 0-100. Respond ONLY with valid JSON.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                types.Part.from_text(text=image_prompt),
            ],
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=4096,
            )
        )
        return _parse_gemini_response(response)

    except json.JSONDecodeError as e:
        return {"error": "AI returned invalid JSON. Please try again.", "detail": str(e)}
    except Exception as e:
        return {"error": f"Image analysis failed: {str(e)}"}
