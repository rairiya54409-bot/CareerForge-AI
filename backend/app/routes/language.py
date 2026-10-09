from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.database.mongodb import db
from app.routes.auth import get_current_user_id


router = APIRouter(
    prefix="/api/language",
    tags=["Language Settings"],
)

users_collection = db["users"]


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


class LanguageUpdate(BaseModel):
    language: str = Field(
        ...,
        min_length=2,
        max_length=5,
    )


@router.get("")
def get_language(
    current_user_id: str = Depends(get_current_user_id),
):
    if not ObjectId.is_valid(current_user_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid user ID",
        )

    user = users_collection.find_one(
        {"_id": ObjectId(current_user_id)}
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    language_code = user.get(
        "preferred_language",
        "en",
    )

    return {
        "status": "success",
        "language": language_code,
        "language_name": SUPPORTED_LANGUAGES.get(
            language_code,
            "English",
        ),
        "supported_languages": [
            {
                "code": code,
                "name": name,
            }
            for code, name in SUPPORTED_LANGUAGES.items()
        ],
    }


@router.put("")
def update_language(
    language_data: LanguageUpdate,
    current_user_id: str = Depends(get_current_user_id),
):
    if not ObjectId.is_valid(current_user_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid user ID",
        )

    language_code = language_data.language.strip().lower()

    if language_code not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported language. "
                "Supported languages: "
                + ", ".join(SUPPORTED_LANGUAGES.keys())
            ),
        )

    user = users_collection.find_one(
        {"_id": ObjectId(current_user_id)}
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    users_collection.update_one(
        {"_id": ObjectId(current_user_id)},
        {
            "$set": {
                "preferred_language": language_code,
                "language_updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return {
        "status": "success",
        "message": "Preferred language updated",
        "language": language_code,
        "language_name": SUPPORTED_LANGUAGES[language_code],
    }