from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.database.mongodb import db
from app.routes.auth import get_current_user_id
from app.routes.skill_progress import record_test_performance


router = APIRouter(
    prefix="/api/tests",
    tags=["Test Engine"],
)


test_sessions_collection = db["test_sessions"]


VALID_TEST_TYPES = {
    "interview",
    "coding",
    "aptitude",
}


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


VALID_STATUSES = {
    "active",
    "completed",
    "abandoned",
}


class TestSessionCreate(BaseModel):
    test_type: str = Field(
        ...,
        min_length=3,
        max_length=20,
    )

    language: str = Field(
        default="en",
        min_length=2,
        max_length=5,
    )

    role: str | None = Field(
        default=None,
        max_length=100,
    )

    programming_language: str | None = Field(
        default=None,
        max_length=50,
    )

    difficulty: str | None = Field(
        default=None,
        max_length=30,
    )

    @field_validator("test_type")
    @classmethod
    def validate_test_type(
        cls,
        value: str,
    ) -> str:

        value = value.strip().lower()

        if value not in VALID_TEST_TYPES:
            raise ValueError(
                "Invalid test type. "
                "Use interview, coding, or aptitude."
            )

        return value

    @field_validator("language")
    @classmethod
    def validate_language(
        cls,
        value: str,
    ) -> str:

        value = value.strip().lower()

        if value not in SUPPORTED_LANGUAGES:
            raise ValueError(
                "Unsupported language."
            )

        return value


class TestSessionStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(
        cls,
        value: str,
    ) -> str:

        value = value.strip().lower()

        if value not in VALID_STATUSES:
            raise ValueError(
                "Invalid session status. "
                "Use active, completed, or abandoned."
            )

        return value


def calculate_session_score(session):
    """
    Calculate final score from stored answers.
    """

    answers = session.get(
        "answers",
        [],
    )

    if not answers:
        return None

    test_type = session.get(
        "test_type"
    )

    # -----------------------------------------
    # Aptitude
    # -----------------------------------------

    if test_type == "aptitude":

        correct_answers = sum(
            1
            for answer in answers
            if answer.get("is_correct") is True
        )

        return round(
            (
                correct_answers
                / len(answers)
            )
            * 100,
            2,
        )

    # -----------------------------------------
    # Coding
    # -----------------------------------------

    if test_type == "coding":

        scores = [
            float(answer["score"])
            for answer in answers
            if answer.get("score") is not None
        ]

        if not scores:
            return None

        return round(
            sum(scores) / len(scores),
            2,
        )

    # -----------------------------------------
    # Interview
    # -----------------------------------------

    if test_type == "interview":

        import re

        scores = []

        for answer in answers:

            evaluation = answer.get(
                "evaluation",
                "",
            )

            match = re.search(
                r"(?:score|overall score)"
                r"\s*[:\-]?\s*(\d+)"
                r"(?:\s*/\s*100)?",
                evaluation,
                re.IGNORECASE,
            )

            if match:
                score = int(
                    match.group(1)
                )

                if 0 <= score <= 100:
                    scores.append(score)

        if not scores:
            return None

        return round(
            sum(scores) / len(scores),
            2,
        )

    return None


@router.post("/start")
def start_test_session(
    session_data: TestSessionCreate,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    now = datetime.now(
        timezone.utc
    )

    document = {
        "user_id": current_user_id,
        "test_type": session_data.test_type,
        "language": session_data.language,
        "language_name": (
            SUPPORTED_LANGUAGES[
                session_data.language
            ]
        ),
        "role": session_data.role,
        "programming_language": (
            session_data.programming_language
        ),
        "difficulty": session_data.difficulty,
        "status": "active",
        "score": None,
        "total_questions": 0,
        "answered_questions": 0,
        "answers": [],
        "created_at": now,
        "updated_at": now,
    }

    result = test_sessions_collection.insert_one(
        document
    )

    return {
        "status": "success",
        "message": "Test session started",
        "session_id": str(
            result.inserted_id
        ),
        "test_type": session_data.test_type,
        "language": session_data.language,
        "language_name": (
            SUPPORTED_LANGUAGES[
                session_data.language
            ]
        ),
        "status": "active",
    }


@router.get("")
def get_test_sessions(
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    sessions = list(
        test_sessions_collection.find(
            {
                "user_id": current_user_id
            }
        ).sort(
            "created_at",
            -1,
        )
    )

    for session in sessions:
        session["_id"] = str(
            session["_id"]
        )

    return {
        "status": "success",
        "total_sessions": len(sessions),
        "sessions": sessions,
    }


@router.get("/{session_id}")
def get_test_session(
    session_id: str,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    if not ObjectId.is_valid(
        session_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid session ID",
        )

    session = test_sessions_collection.find_one(
        {
            "_id": ObjectId(session_id),
            "user_id": current_user_id,
        }
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Test session not found",
        )

    session["_id"] = str(
        session["_id"]
    )

    return {
        "status": "success",
        "session": session,
    }


@router.patch("/{session_id}/status")
def update_test_session_status(
    session_id: str,
    status_data: TestSessionStatusUpdate,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    if not ObjectId.is_valid(
        session_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid session ID",
        )

    session = test_sessions_collection.find_one(
        {
            "_id": ObjectId(session_id),
            "user_id": current_user_id,
        }
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Test session not found",
        )

    now = datetime.now(
        timezone.utc
    )

    final_score = session.get(
        "score"
    )

    skill_result = None

    # -----------------------------------------
    # Complete test
    # -----------------------------------------

    if status_data.status == "completed":

        final_score = calculate_session_score(
            session
        )

        if final_score is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Cannot complete test "
                    "without a valid score."
                ),
            )

        # Update session score first.
        test_sessions_collection.update_one(
            {
                "_id": ObjectId(session_id),
                "user_id": current_user_id,
            },
            {
                "$set": {
                    "status": "completed",
                    "score": final_score,
                    "completed_at": now,
                    "updated_at": now,
                }
            },
        )

        # -----------------------------------------
        # Automatically update Skill Progress
        # -----------------------------------------

        skill_result = record_test_performance(
            user_id=current_user_id,
            test_type=session.get(
                "test_type",
                "",
            ),
            score=final_score,
            programming_language=session.get(
                "programming_language"
            ),
            category=session.get(
                "category"
            ),
            role=session.get(
                "role"
            ),
        )

    else:

        test_sessions_collection.update_one(
            {
                "_id": ObjectId(session_id),
                "user_id": current_user_id,
            },
            {
                "$set": {
                    "status": status_data.status,
                    "updated_at": now,
                }
            },
        )

    response = {
        "status": "success",
        "message": "Test session status updated",
        "session_id": session_id,
        "new_status": status_data.status,
    }

    if status_data.status == "completed":

        response["final_score"] = final_score

        response["skill_progress"] = (
            skill_result
        )

    return response