import os
import time
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from google import genai

from app.database.mongodb import db
from app.routes.auth import get_current_user_id
from app.routes.chatbot import (
    get_user_context,
    SUPPORTED_LANGUAGES,
)


router = APIRouter(
    prefix="/api/tests/interview",
    tags=["Mock Interview"],
)


test_sessions_collection = db["test_sessions"]


VALID_INTERVIEW_TYPES = {
    "technical",
    "hr",
    "behavioral",
}


VALID_DIFFICULTIES = {
    "easy",
    "medium",
    "hard",
}


class InterviewStartRequest(BaseModel):
    session_id: str = Field(
        ...,
        min_length=1,
    )

    interview_type: str = Field(
        default="technical",
    )

    role: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    difficulty: str = Field(
        default="medium",
    )

    @field_validator("interview_type")
    @classmethod
    def validate_interview_type(
        cls,
        value: str,
    ) -> str:
        value = value.strip().lower()

        if value not in VALID_INTERVIEW_TYPES:
            raise ValueError(
                "Invalid interview type. "
                "Use technical, hr, or behavioral."
            )

        return value

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(
        cls,
        value: str,
    ) -> str:
        value = value.strip().lower()

        if value not in VALID_DIFFICULTIES:
            raise ValueError(
                "Invalid difficulty. "
                "Use easy, medium, or hard."
            )

        return value

    @field_validator("role")
    @classmethod
    def validate_role(
        cls,
        value: str,
    ) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "Role cannot be empty."
            )

        return value


class InterviewAnswerRequest(BaseModel):
    session_id: str = Field(
        ...,
        min_length=1,
    )

    question: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )

    answer: str = Field(
        ...,
        min_length=1,
        max_length=10000,
    )


def get_interview_session(
    session_id: str,
    user_id: str,
):
    if not ObjectId.is_valid(session_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid session ID",
        )

    session = test_sessions_collection.find_one(
        {
            "_id": ObjectId(session_id),
            "user_id": user_id,
            "test_type": "interview",
        }
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found",
        )

    return session


def ask_interview_gemini(
    prompt: str,
) -> str:

    api_key = os.getenv(
        "GEMINI_API_KEY"
    )

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured"
        )

    client = genai.Client(
        api_key=api_key
    )

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
                    f"Interview Gemini error "
                    f"(model={model_name}, "
                    f"attempt={attempt + 1}):",
                    error,
                )

                time.sleep(
                    2 ** attempt
                )

    raise RuntimeError(
        f"Interview AI failed: {last_error}"
    )


@router.post("/start")
def start_interview(
    request: InterviewStartRequest,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    session = get_interview_session(
        request.session_id,
        current_user_id,
    )

    language = session.get(
        "language",
        "en",
    )

    language_name = SUPPORTED_LANGUAGES.get(
        language,
        "English",
    )

    context = get_user_context(
        current_user_id
    )

    prompt = f"""
You are an AI interviewer for CareerForge AI.

Generate the FIRST interview question for the candidate.

Interview type:
{request.interview_type}

Target role:
{request.role}

Difficulty:
{request.difficulty}

Interview language:
{language_name}

Candidate career profile:
{context}

IMPORTANT:
- Ask the question entirely in {language_name}.
- The question should be relevant to the target role.
- Use the candidate's profile when useful.
- Do not invent candidate experience.
- Make the question realistic for an actual interview.
- Do not provide the answer.
- Return only the interview question.
"""

    try:
        question = ask_interview_gemini(
            prompt
        )

        now = datetime.now(
            timezone.utc
        )

        test_sessions_collection.update_one(
            {
                "_id": ObjectId(
                    request.session_id
                ),
                "user_id": current_user_id,
            },
            {
                "$set": {
                    "interview_type": (
                        request.interview_type
                    ),
                    "role": request.role,
                    "difficulty": (
                        request.difficulty
                    ),
                    "current_question": question,
                    "updated_at": now,
                }
            },
        )

        return {
            "status": "success",
            "session_id": request.session_id,
            "question": question,
            "language": language,
            "language_name": language_name,
            "interview_type": (
                request.interview_type
            ),
            "role": request.role,
            "difficulty": (
                request.difficulty
            ),
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Interview start error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to generate interview question",
        )


@router.post("/answer")
def answer_interview_question(
    request: InterviewAnswerRequest,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    session = get_interview_session(
        request.session_id,
        current_user_id,
    )

    language = session.get(
        "language",
        "en",
    )

    language_name = SUPPORTED_LANGUAGES.get(
        language,
        "English",
    )

    context = get_user_context(
        current_user_id
    )

    prompt = f"""
You are an expert interview evaluator for CareerForge AI.

Evaluate the candidate's interview answer.

Target role:
{session.get("role", "Unknown")}

Interview type:
{session.get("interview_type", "technical")}

Difficulty:
{session.get("difficulty", "medium")}

Interview language:
{language_name}

Candidate profile:
{context}

Interview question:
{request.question}

Candidate answer:
{request.answer}

Evaluate:
1. Overall score out of 100
2. Technical/content quality
3. Communication quality
4. Relevance to the question
5. Strengths
6. Weaknesses
7. Specific improvement suggestions
8. A better example answer

IMPORTANT:
- Respond entirely in {language_name}.
- Do not invent candidate experience.
- Give constructive and realistic feedback.
- Keep the feedback understandable.
- Clearly show the score.
"""

    try:
        evaluation = ask_interview_gemini(
            prompt
        )

        now = datetime.now(
            timezone.utc
        )

        answer_record = {
            "question": request.question,
            "answer": request.answer,
            "evaluation": evaluation,
            "created_at": now,
        }

        test_sessions_collection.update_one(
            {
                "_id": ObjectId(
                    request.session_id
                ),
                "user_id": current_user_id,
            },
            {
                "$push": {
                    "answers": answer_record
                },
                "$inc": {
                    "answered_questions": 1
                },
                "$set": {
                    "updated_at": now
                },
            },
        )

        return {
            "status": "success",
            "session_id": request.session_id,
            "language": language,
            "language_name": language_name,
            "evaluation": evaluation,
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Interview evaluation error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to evaluate interview answer",
        )