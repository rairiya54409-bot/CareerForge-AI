import json
import os
import time

from dotenv import load_dotenv
from google import genai


load_dotenv()


# =========================================================
# CONFIGURATION
# =========================================================

PRIMARY_MODEL = "gemini-3.6-flash"

# Backup model in case the primary model is temporarily
# unavailable.
FALLBACK_MODEL = "gemini-3.5-flash"

MAX_RETRIES = 3


# =========================================================
# RESUME ANALYSIS
# =========================================================

def analyze_resume_with_ai(resume_text: str) -> dict:

    # -----------------------------------------------------
    # CHECK API KEY
    # -----------------------------------------------------

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is missing from the .env file"
        )

    # -----------------------------------------------------
    # CREATE GEMINI CLIENT
    # -----------------------------------------------------

    client = genai.Client(
        api_key=api_key
    )

    # -----------------------------------------------------
    # PROMPT
    # -----------------------------------------------------

    prompt = f"""
You are an expert resume and career analyst.

Analyze the resume below.

Return ONLY valid JSON using exactly this structure:

{{
    "candidate": {{
        "name": null,
        "email": null,
        "phone": null
    }},
    "education": [],
    "experience": [],
    "projects": [],
    "technical_skills": [],
    "soft_skills": [],
    "certifications": [],
    "career_interests": [],
    "resume_score": 0,
    "ats_score": 0,
    "strengths": [],
    "weaknesses": [],
    "missing_skills": [],
    "recommended_roles": []
}}

Rules:

1. Use only information supported by the resume.
2. Do not invent education, experience, projects or skills.
3. resume_score must be between 0 and 100.
4. ats_score must be between 0 and 100.
5. Recommend realistic career roles.
6. Identify useful missing skills.
7. Keep the response concise.
8. Return JSON only.

RESUME:

{resume_text}
"""

    # -----------------------------------------------------
    # MODELS TO TRY
    # -----------------------------------------------------

    models_to_try = [
        PRIMARY_MODEL,
        FALLBACK_MODEL,
    ]

    last_error = None

    # -----------------------------------------------------
    # TRY PRIMARY + FALLBACK MODEL
    # -----------------------------------------------------

    for model_name in models_to_try:

        for attempt in range(MAX_RETRIES):

            try:

                print(
                    f"Gemini request: "
                    f"model={model_name}, "
                    f"attempt={attempt + 1}"
                )

                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json"
                    }
                )

                # -------------------------------------------------
                # CHECK RESPONSE
                # -------------------------------------------------

                if not response.text:

                    raise RuntimeError(
                        "Gemini returned an empty response"
                    )

                # -------------------------------------------------
                # PARSE JSON
                # -------------------------------------------------

                try:

                    analysis = json.loads(
                        response.text
                    )

                except json.JSONDecodeError as error:

                    raise RuntimeError(
                        f"Gemini returned invalid JSON: {error}"
                    )

                print(
                    f"Gemini analysis successful "
                    f"using {model_name}"
                )

                return analysis

            except Exception as error:

                last_error = error

                error_text = str(error)

                print(
                    f"Gemini error "
                    f"(model={model_name}, "
                    f"attempt={attempt + 1}): "
                    f"{error_text}"
                )

                # -------------------------------------------------
                # RETRY TEMPORARY SERVER ERRORS
                # -------------------------------------------------

                if (
                    "503" in error_text
                    or "UNAVAILABLE" in error_text
                    or "500" in error_text
                    or "429" in error_text
                    or "RESOURCE_EXHAUSTED" in error_text
                ):

                    if attempt < MAX_RETRIES - 1:

                        wait_time = 2 ** attempt

                        print(
                            f"Retrying in "
                            f"{wait_time} seconds..."
                        )

                        time.sleep(
                            wait_time
                        )

                        continue

                # -------------------------------------------------
                # NON-RETRYABLE ERROR
                # -------------------------------------------------

                break

        print(
            f"Primary attempt sequence failed "
            f"for model: {model_name}"
        )

    # ---------------------------------------------------------
    # ALL ATTEMPTS FAILED
    # ---------------------------------------------------------

    raise RuntimeError(
        "Gemini resume analysis failed after "
        f"trying available models. "
        f"Last error: {last_error}"
    )