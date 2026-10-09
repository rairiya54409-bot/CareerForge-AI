from datetime import datetime, timezone
import os
import re

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from google import genai

from app.database.mongodb import db
from app.routes.auth import get_current_user_id


router = APIRouter(
    prefix="/api/tests/coding",
    tags=["Coding Test"],
)

test_sessions_collection = db["test_sessions"]


SUPPORTED_QUESTION_LANGUAGES = {
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

SUPPORTED_PROGRAMMING_LANGUAGES = {
    "python",
    "cpp",
    "java",
    "javascript",
}

VALID_DIFFICULTIES = {
    "easy",
    "medium",
    "hard",
}


class CodingStartRequest(BaseModel):
    session_id: str
    role: str = Field(..., min_length=2, max_length=100)
    difficulty: str = Field(default="medium", min_length=3, max_length=20)

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, value: str) -> str:
        value = value.strip().lower()

        if value not in VALID_DIFFICULTIES:
            raise ValueError(
                "Invalid difficulty. Use easy, medium, or hard."
            )

        return value


class CodingAnswerRequest(BaseModel):
    session_id: str
    question: str = Field(..., min_length=1, max_length=10000)
    code: str = Field(..., min_length=1, max_length=30000)


def get_coding_session(
    session_id: str,
    current_user_id: str,
):
    if not ObjectId.is_valid(session_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid session ID",
        )

    session = test_sessions_collection.find_one({
        "_id": ObjectId(session_id),
        "user_id": current_user_id,
        "test_type": "coding",
    })

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Coding test session not found",
        )

    return session


def ask_coding_gemini(
    prompt: str,
):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured",
        )

    client = genai.Client(api_key=api_key)

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

                text = response.text

                if text and text.strip():
                    return text.strip()

            except Exception as error:
                last_error = error

                if attempt < 2:
                    import time
                    time.sleep(2 ** attempt)

    raise HTTPException(
        status_code=502,
        detail=f"Gemini coding generation failed: {last_error}",
    )


@router.post("/start")
def start_coding_test(
    request: CodingStartRequest,
    current_user_id: str = Depends(get_current_user_id),
):
    session = get_coding_session(
        request.session_id,
        current_user_id,
    )

    language = session.get("language", "en")

    if language not in SUPPORTED_QUESTION_LANGUAGES:
        language = "en"

    programming_language = session.get(
        "programming_language"
    )

    if not programming_language:
        raise HTTPException(
            status_code=400,
            detail="Programming language was not selected for this session",
        )

    programming_language = programming_language.strip().lower()

    if programming_language not in SUPPORTED_PROGRAMMING_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported programming language. "
                "Use python, cpp, java, or javascript."
            ),
        )

    language_name = SUPPORTED_QUESTION_LANGUAGES[language]

    prompt = f"""
You are a professional coding assessment generator.

Create ONE coding interview problem.

Requirements:

Question language:
{language_name}

Programming language:
{programming_language}

Difficulty:
{request.difficulty}

Role:
{request.role}

The problem must:
- be realistic for a technical coding assessment
- clearly describe the problem
- provide input/output expectations where applicable
- include constraints
- include 1 or 2 examples
- be solvable using {programming_language}
- NOT provide the solution
- NOT provide code
- NOT reveal the answer

Write the entire problem in {language_name}.

Use clear formatting with these sections:

Problem
Input
Output
Constraints
Example

Return only the coding problem.
"""

    question = ask_coding_gemini(prompt)

    now = datetime.now(timezone.utc)

    test_sessions_collection.update_one(
        {
            "_id": ObjectId(request.session_id),
            "user_id": current_user_id,
        },
        {
            "$set": {
                "role": request.role,
                "difficulty": request.difficulty,
                "programming_language": programming_language,
                "current_question": question,
                "updated_at": now,
            }
        },
    )

    return {
        "status": "success",
        "session_id": request.session_id,
        "test_type": "coding",
        "language": language,
        "language_name": language_name,
        "programming_language": programming_language,
        "difficulty": request.difficulty,
        "question": question,
    }


@router.post("/submit")
def submit_coding_answer(
    request: CodingAnswerRequest,
    current_user_id: str = Depends(get_current_user_id),
):
    session = get_coding_session(
        request.session_id,
        current_user_id,
    )

    language = session.get("language", "en")

    if language not in SUPPORTED_QUESTION_LANGUAGES:
        language = "en"

    language_name = SUPPORTED_QUESTION_LANGUAGES[language]

    programming_language = session.get(
        "programming_language",
        "python",
    )

    prompt = f"""
You are evaluating a coding assessment submission.

Question language:
{language_name}

Programming language:
{programming_language}

Coding problem:
{request.question}

Candidate's code:
{request.code}

Evaluate the submission carefully.

Check:

1. Correctness
2. Logic
3. Edge cases
4. Time complexity
5. Space complexity
6. Code quality
7. Whether the solution actually solves the problem

Give a score from 0 to 100.

Do NOT execute the code.

Return the evaluation in {language_name}.

Use exactly these sections:

Score:
Verdict:
Strengths:
Issues:
Time Complexity:
Space Complexity:
Improvement Suggestions:
"""

    evaluation = ask_coding_gemini(prompt)

    score = None

    score_match = re.search(
        r"Score\s*:\s*(\d+)",
        evaluation,
        re.IGNORECASE,
    )

    if score_match:
        score = min(
            100,
            max(
                0,
                int(score_match.group(1)),
            ),
        )

    answer_record = {
        "question": request.question,
        "code": request.code,
        "evaluation": evaluation,
        "score": score,
        "submitted_at": datetime.now(timezone.utc),
    }

    result = test_sessions_collection.update_one(
        {
            "_id": ObjectId(request.session_id),
            "user_id": current_user_id,
            "test_type": "coding",
        },
        {
            "$push": {
                "answers": answer_record,
            },
            "$inc": {
                "answered_questions": 1,
            },
            "$set": {
                "updated_at": datetime.now(timezone.utc),
            },
        },
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Coding test session not found",
        )

    return {
        "status": "success",
        "session_id": request.session_id,
        "language": language,
        "language_name": language_name,
        "programming_language": programming_language,
        "score": score,
        "evaluation": evaluation,
    }