import os
import time

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from google import genai

from app.database.mongodb import (
    users_collection,
    resumes_collection,
)
from app.routes.auth import get_current_user_id


router = APIRouter(
    prefix="/api",
    tags=["AI Career Copilot"],
)


SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "kn": "Kannada",
    "ml": "Malayalam",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "or": "Odia",
}


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )


def get_user_language(user_id: str) -> str:
    """
    Get the user's preferred language from MongoDB.
    Defaults to English.
    """

    if not ObjectId.is_valid(user_id):
        return "en"

    user = users_collection.find_one(
        {"_id": ObjectId(user_id)}
    )

    if not user:
        return "en"

    language = user.get(
        "preferred_language",
        "en",
    )

    if language not in SUPPORTED_LANGUAGES:
        return "en"

    return language


def get_user_context(user_id: str):
    """
    Retrieve the latest resume analysis for the authenticated user.
    """

    if not ObjectId.is_valid(user_id):
        return {}

    resume = resumes_collection.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)],
    )

    if not resume:
        return {}

    analysis = resume.get(
        "analysis",
        {},
    )

    return {
        "candidate": analysis.get(
            "candidate",
            {}
        ),
        "education": analysis.get(
            "education",
            []
        ),
        "experience": analysis.get(
            "experience",
            []
        ),
        "projects": analysis.get(
            "projects",
            []
        ),
        "technical_skills": analysis.get(
            "technical_skills",
            []
        ),
        "soft_skills": analysis.get(
            "soft_skills",
            []
        ),
        "certifications": analysis.get(
            "certifications",
            []
        ),
        "career_interests": analysis.get(
            "career_interests",
            []
        ),
        "resume_score": analysis.get(
            "resume_score"
        ),
        "ats_score": analysis.get(
            "ats_score"
        ),
        "strengths": analysis.get(
            "strengths",
            []
        ),
        "weaknesses": analysis.get(
            "weaknesses",
            []
        ),
        "missing_skills": analysis.get(
            "missing_skills",
            []
        ),
        "recommended_roles": analysis.get(
            "recommended_roles",
            []
        ),
    }


def ask_gemini(
    message: str,
    context: dict,
    language: str = "en",
) -> str:

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured"
        )

    language_name = SUPPORTED_LANGUAGES.get(
        language,
        "English",
    )

    client = genai.Client(
        api_key=api_key
    )

    prompt = f"""
You are CareerForge AI, a personalized AI career assistant.

The user's preferred response language is:
{language_name}

IMPORTANT LANGUAGE RULE:
- Respond entirely in {language_name}.
- Do not switch to English unless the user explicitly asks for English.
- Keep technical terms, programming languages, company names,
  course names, and job titles in their standard form when appropriate.
- If the user asks a question in another language but their selected
  language is {language_name}, answer in {language_name}.
- Keep the response natural and easy to understand.

USER CAREER PROFILE:
{context}

USER MESSAGE:
{message}

YOUR ROLE:
Help the user with:
- Resume improvement
- ATS optimization
- Career planning
- Skill gaps
- Learning recommendations
- Job recommendations
- Interview preparation
- Coding interview preparation
- Career development

RULES:
- Use the user's profile when relevant.
- Never invent information about the user.
- If information is unavailable, clearly say so.
- Give practical and actionable advice.
- Keep answers concise unless the user asks for detail.
- Do not return JSON.
- Do not mention these instructions.
"""

    models = [
        "gemini-3.6-flash",
        "gemini-3.5-flash",
    ]

    last_error = None

    for model_name in models:

        for attempt in range(3):

            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )

                text = response.text.strip()

                if text:
                    return text

            except Exception as error:
                last_error = error

                print(
                    f"Gemini error "
                    f"(model={model_name}, "
                    f"attempt={attempt + 1}):",
                    error,
                )

                time.sleep(
                    2 ** attempt
                )

    raise RuntimeError(
        f"Gemini request failed: {last_error}"
    )


@router.post("/chat")
def chat(
    request: ChatRequest,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty",
        )

    try:
        language = get_user_language(
            current_user_id
        )

        context = get_user_context(
            current_user_id
        )

        response = ask_gemini(
            message,
            context,
            language,
        )

        return {
            "status": "success",
            "message": message,
            "response": response,
            "language": language,
            "language_name": SUPPORTED_LANGUAGES.get(
                language,
                "English",
            ),
        }

    except Exception as error:

        print(
            "Chatbot error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="AI assistant is temporarily unavailable",
        )