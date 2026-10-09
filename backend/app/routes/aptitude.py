from datetime import datetime, timezone
import os
import json

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from google import genai

from app.database.mongodb import db
from app.routes.auth import get_current_user_id


router = APIRouter(
    prefix="/api/tests/aptitude",
    tags=["Aptitude Test"],
)

test_sessions_collection = db["test_sessions"]

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

VALID_DIFFICULTIES = {
    "easy",
    "medium",
    "hard",
}

VALID_CATEGORIES = {
    "quantitative",
    "logical_reasoning",
    "verbal",
    "data_interpretation",
}


class AptitudeStartRequest(BaseModel):
    session_id: str
    category: str = Field(
        default="quantitative",
        min_length=3,
        max_length=30,
    )
    difficulty: str = Field(
        default="medium",
        min_length=3,
        max_length=20,
    )

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        value = value.strip().lower()

        if value not in VALID_CATEGORIES:
            raise ValueError(
                "Invalid category. Use quantitative, "
                "logical_reasoning, verbal, or data_interpretation."
            )

        return value

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, value: str) -> str:
        value = value.strip().lower()

        if value not in VALID_DIFFICULTIES:
            raise ValueError(
                "Invalid difficulty. Use easy, medium, or hard."
            )

        return value


class AptitudeAnswerRequest(BaseModel):
    session_id: str
    question: str = Field(..., min_length=1, max_length=10000)
    selected_option: str = Field(..., min_length=1, max_length=500)


def get_aptitude_session(
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
        "test_type": "aptitude",
    })

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Aptitude test session not found",
        )

    return session


def ask_aptitude_gemini(prompt: str):
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
                    config={
                        "response_mime_type": "application/json"
                    },
                )

                if response.text and response.text.strip():
                    return response.text.strip()

            except Exception as error:
                last_error = error

                if attempt < 2:
                    import time
                    time.sleep(2 ** attempt)

    raise HTTPException(
        status_code=502,
        detail=f"Gemini aptitude generation failed: {last_error}",
    )


@router.post("/start")
def start_aptitude_test(
    request: AptitudeStartRequest,
    current_user_id: str = Depends(get_current_user_id),
):
    session = get_aptitude_session(
        request.session_id,
        current_user_id,
    )

    language = session.get("language", "en")

    if language not in SUPPORTED_LANGUAGES:
        language = "en"

    language_name = SUPPORTED_LANGUAGES[language]

    category_names = {
        "quantitative": "Quantitative Aptitude",
        "logical_reasoning": "Logical Reasoning",
        "verbal": "Verbal Ability",
        "data_interpretation": "Data Interpretation",
    }

    category_name = category_names[request.category]

    prompt = f"""
You are a professional aptitude test question generator.

Generate ONE high-quality multiple-choice aptitude question.

Question language:
{language_name}

Category:
{category_name}

Difficulty:
{request.difficulty}

Requirements:

- Exactly 4 options.
- Only ONE option must be correct.
- The question must have a definite answer.
- Avoid ambiguous wording.
- For quantitative questions, ensure the calculations are correct.
- For logical reasoning questions, ensure the reasoning is valid.
- For verbal questions, ensure there is only one best answer.
- For data interpretation questions, provide all required data inside the question.
- Do NOT reveal the answer in the explanation field until the candidate submits an answer.

Return ONLY valid JSON in this exact structure:

{{
    "question": "question text",
    "options": [
        "A. option",
        "B. option",
        "C. option",
        "D. option"
    ],
    "correct_option": "A",
    "explanation": "short explanation"
}}

Write the question, options and explanation in {language_name}.
"""

    raw_response = ask_aptitude_gemini(prompt)

    try:
        question_data = json.loads(raw_response)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="Gemini returned invalid aptitude question format",
        )

    required_fields = {
        "question",
        "options",
        "correct_option",
        "explanation",
    }

    if not required_fields.issubset(question_data.keys()):
        raise HTTPException(
            status_code=502,
            detail="Incomplete aptitude question generated",
        )

    if not isinstance(question_data["options"], list):
        raise HTTPException(
            status_code=502,
            detail="Invalid aptitude options format",
        )

    if len(question_data["options"]) != 4:
        raise HTTPException(
            status_code=502,
            detail="Aptitude question must contain exactly 4 options",
        )

    correct_option = str(
        question_data["correct_option"]
    ).strip().upper()

    if correct_option not in {"A", "B", "C", "D"}:
        raise HTTPException(
            status_code=502,
            detail="Invalid correct option generated",
        )

    question_data["correct_option"] = correct_option

    now = datetime.now(timezone.utc)

    test_sessions_collection.update_one(
        {
            "_id": ObjectId(request.session_id),
            "user_id": current_user_id,
        },
        {
            "$set": {
                "category": request.category,
                "difficulty": request.difficulty,
                "current_question": question_data,
                "updated_at": now,
            }
        },
    )

    # Do not expose correct answer to the candidate.
    public_question = {
        "question": question_data["question"],
        "options": question_data["options"],
    }

    return {
        "status": "success",
        "session_id": request.session_id,
        "test_type": "aptitude",
        "language": language,
        "language_name": language_name,
        "category": request.category,
        "difficulty": request.difficulty,
        "question": public_question,
    }


@router.post("/answer")
def submit_aptitude_answer(
    request: AptitudeAnswerRequest,
    current_user_id: str = Depends(get_current_user_id),
):
    session = get_aptitude_session(
        request.session_id,
        current_user_id,
    )

    current_question = session.get("current_question")

    if not current_question:
        raise HTTPException(
            status_code=400,
            detail="No active aptitude question",
        )

    correct_option = str(
        current_question.get("correct_option", "")
    ).strip().upper()

    selected_option = request.selected_option.strip().upper()

    # Accept A / B / C / D as well as "A. ..."
    selected_letter = selected_option[:1]

    is_correct = (
        selected_letter in {"A", "B", "C", "D"}
        and selected_letter == correct_option
    )

    language = session.get("language", "en")

    if language not in SUPPORTED_LANGUAGES:
        language = "en"

    language_name = SUPPORTED_LANGUAGES[language]

    if is_correct:
        result_message = (
            "Correct answer."
            if language == "en"
            else f"Correct answer. Respond in {language_name}."
        )
    else:
        result_message = (
            f"Incorrect. The correct option is {correct_option}."
            if language == "en"
            else (
                f"Incorrect. The correct option is "
                f"{correct_option}. Respond in {language_name}."
            )
        )

    answer_record = {
        "question": request.question,
        "selected_option": selected_option,
        "correct_option": correct_option,
        "is_correct": is_correct,
        "explanation": current_question.get(
            "explanation",
            "",
        ),
        "answered_at": datetime.now(timezone.utc),
    }

    current_answers = session.get("answers", [])

    total_answered = len(current_answers) + 1

    correct_answers = sum(
        1
        for answer in current_answers
        if answer.get("is_correct") is True
    )

    if is_correct:
        correct_answers += 1

    score = round(
        (correct_answers / total_answered) * 100,
        2,
    )

    test_sessions_collection.update_one(
        {
            "_id": ObjectId(request.session_id),
            "user_id": current_user_id,
            "test_type": "aptitude",
        },
        {
            "$push": {
                "answers": answer_record,
            },
            "$inc": {
                "answered_questions": 1,
            },
            "$set": {
                "score": score,
                "updated_at": datetime.now(timezone.utc),
            },
        },
    )

    return {
        "status": "success",
        "session_id": request.session_id,
        "language": language,
        "language_name": language_name,
        "selected_option": selected_option,
        "correct": is_correct,
        "correct_option": correct_option,
        "explanation": current_question.get(
            "explanation",
            "",
        ),
        "score": score,
        "answered_questions": total_answered,
        "correct_answers": correct_answers,
        "message": result_message,
    }