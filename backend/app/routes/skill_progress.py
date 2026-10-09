from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.database.mongodb import db
from app.routes.auth import get_current_user_id


router = APIRouter(
    prefix="/api/skill-progress",
    tags=["Skill Progress"],
)


skill_progress_collection = db["skill_progress"]


VALID_LEVELS = {
    "Beginner",
    "Intermediate",
    "Advanced",
}


VALID_EVIDENCE = {
    "Self-reported",
    "Course",
    "Project",
    "Certification",
    "Assessment",
}


TEST_SKILL_MAPPING = {
    "interview": "Technical Interview",
    "coding": "Programming",
    "aptitude": "Quantitative Aptitude",
}


class SkillProgressCreate(BaseModel):
    skill: str = Field(
        ...,
        min_length=1,
    )

    level: str = "Beginner"

    progress: float = Field(
        default=0,
        ge=0,
        le=100,
    )

    evidence: list[str] = Field(
        default_factory=lambda: ["Self-reported"]
    )

    @field_validator("skill")
    @classmethod
    def validate_skill(
        cls,
        value: str,
    ) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "Skill cannot be empty"
            )

        return value

    @field_validator("level")
    @classmethod
    def validate_level(
        cls,
        value: str,
    ) -> str:
        if value not in VALID_LEVELS:
            raise ValueError(
                "Invalid skill level"
            )

        return value

    @field_validator("evidence")
    @classmethod
    def validate_evidence(
        cls,
        value: list[str],
    ) -> list[str]:
        if not value:
            return ["Self-reported"]

        invalid = [
            item
            for item in value
            if item not in VALID_EVIDENCE
        ]

        if invalid:
            raise ValueError(
                f"Invalid evidence type: {invalid}"
            )

        return list(dict.fromkeys(value))


class SkillProgressUpdate(BaseModel):
    level: str | None = None

    progress: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    evidence: list[str] | None = None

    @field_validator("level")
    @classmethod
    def validate_level(
        cls,
        value: str | None,
    ):
        if (
            value is not None
            and value not in VALID_LEVELS
        ):
            raise ValueError(
                "Invalid skill level"
            )

        return value

    @field_validator("evidence")
    @classmethod
    def validate_evidence(
        cls,
        value: list[str] | None,
    ):
        if value is None:
            return value

        if not value:
            return ["Self-reported"]

        invalid = [
            item
            for item in value
            if item not in VALID_EVIDENCE
        ]

        if invalid:
            raise ValueError(
                f"Invalid evidence type: {invalid}"
            )

        return list(dict.fromkeys(value))


class TestPerformanceUpdate(BaseModel):
    test_type: str = Field(
        ...,
        min_length=3,
        max_length=20,
    )

    score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    programming_language: str | None = Field(
        default=None,
        max_length=50,
    )

    category: str | None = Field(
        default=None,
        max_length=50,
    )

    role: str | None = Field(
        default=None,
        max_length=100,
    )

    @field_validator("test_type")
    @classmethod
    def validate_test_type(
        cls,
        value: str,
    ) -> str:
        value = value.strip().lower()

        if value not in {
            "interview",
            "coding",
            "aptitude",
        }:
            raise ValueError(
                "Invalid test type. "
                "Use interview, coding, or aptitude."
            )

        return value


def record_test_performance(
    user_id: str,
    test_type: str,
    score: float,
    programming_language: str | None = None,
    category: str | None = None,
    role: str | None = None,
):
    """
    Automatically update Skill Progress
    when a test is completed.
    """

    test_type = test_type.strip().lower()

    # -----------------------------------------
    # Determine skill
    # -----------------------------------------

    if test_type == "coding":

        if programming_language:

            programming_language = (
                programming_language
                .strip()
                .lower()
            )

            programming_language_mapping = {
                "python": "Python",
                "cpp": "C++",
                "c++": "C++",
                "java": "Java",
                "javascript": "JavaScript",
                "js": "JavaScript",
            }

            skill_name = (
                programming_language_mapping.get(
                    programming_language,
                    "Programming",
                )
            )

        else:
            skill_name = "Programming"

    elif test_type == "aptitude":

        category_mapping = {
            "quantitative": "Quantitative Aptitude",
            "logical_reasoning": "Logical Reasoning",
            "verbal": "Verbal Ability",
            "data_interpretation": "Data Interpretation",
        }

        skill_name = category_mapping.get(
            (category or "").strip().lower(),
            "Quantitative Aptitude",
        )

    elif test_type == "interview":

        skill_name = "Technical Interview"

    else:
        return None

    # -----------------------------------------
    # Determine level
    # -----------------------------------------

    if score >= 80:
        level = "Advanced"

    elif score >= 50:
        level = "Intermediate"

    else:
        level = "Beginner"

    now = datetime.now(timezone.utc)

    # -----------------------------------------
    # Find existing skill
    # -----------------------------------------

    existing = skill_progress_collection.find_one(
        {
            "user_id": user_id,
            "skill": {
                "$regex": f"^{skill_name}$",
                "$options": "i",
            },
        }
    )

    # -----------------------------------------
    # Update existing skill
    # -----------------------------------------

    if existing:

        old_progress = float(
            existing.get(
                "progress",
                0,
            )
        )

        new_progress = max(
            old_progress,
            score,
        )

        existing_evidence = existing.get(
            "evidence",
            [],
        )

        existing_evidence = list(
            dict.fromkeys(
                existing_evidence
            )
        )

        if "Assessment" not in existing_evidence:
            existing_evidence.append(
                "Assessment"
            )

        skill_progress_collection.update_one(
            {
                "_id": existing["_id"],
                "user_id": user_id,
            },
            {
                "$set": {
                    "progress": new_progress,
                    "level": level,
                    "evidence": existing_evidence,
                    "last_test_score": score,
                    "last_test_type": test_type,
                    "last_test_at": now,
                    "updated_at": now,
                }
            },
        )

        return {
            "skill_id": str(
                existing["_id"]
            ),
            "skill": skill_name,
            "progress": new_progress,
            "level": level,
        }

    # -----------------------------------------
    # Create new skill
    # -----------------------------------------

    document = {
        "user_id": user_id,
        "skill": skill_name,
        "level": level,
        "progress": score,
        "evidence": [
            "Assessment"
        ],
        "last_test_score": score,
        "last_test_type": test_type,
        "last_test_at": now,
        "created_at": now,
        "updated_at": now,
    }

    result = skill_progress_collection.insert_one(
        document
    )

    return {
        "skill_id": str(
            result.inserted_id
        ),
        "skill": skill_name,
        "progress": score,
        "level": level,
    }


# ============================================================
# BASIC SKILL CRUD
# ============================================================


@router.post("")
def add_or_update_skill(
    skill_data: SkillProgressCreate,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    existing = skill_progress_collection.find_one(
        {
            "user_id": current_user_id,
            "skill": {
                "$regex": f"^{skill_data.skill}$",
                "$options": "i",
            },
        }
    )

    now = datetime.now(timezone.utc)

    if existing:

        update_data = {
            "level": skill_data.level,
            "progress": skill_data.progress,
            "evidence": skill_data.evidence,
            "updated_at": now,
        }

        # SECURITY FIX:
        # Require both skill ID AND current user ID.
        skill_progress_collection.update_one(
            {
                "_id": existing["_id"],
                "user_id": current_user_id,
            },
            {
                "$set": update_data
            },
        )

        return {
            "status": "success",
            "message": "Skill progress updated",
            "skill_id": str(
                existing["_id"]
            ),
        }

    document = {
        "user_id": current_user_id,
        "skill": skill_data.skill,
        "level": skill_data.level,
        "progress": skill_data.progress,
        "evidence": skill_data.evidence,
        "created_at": now,
        "updated_at": now,
    }

    result = skill_progress_collection.insert_one(
        document
    )

    return {
        "status": "success",
        "message": "Skill added successfully",
        "skill_id": str(
            result.inserted_id
        ),
    }


@router.get("")
def get_skill_progress(
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    skills = list(
        skill_progress_collection.find(
            {
                "user_id": current_user_id
            }
        ).sort(
            "updated_at",
            -1,
        )
    )

    for skill in skills:
        skill["_id"] = str(
            skill["_id"]
        )

    return {
        "status": "success",
        "total_skills": len(skills),
        "skills": skills,
    }


# ============================================================
# TEST → SKILL PROGRESS
# ============================================================

# IMPORTANT:
# This route MUST be before /{skill_id}.


@router.post("/from-test")
def update_skill_from_test(
    performance: TestPerformanceUpdate,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    result = record_test_performance(
        user_id=current_user_id,
        test_type=performance.test_type,
        score=performance.score,
        programming_language=(
            performance.programming_language
        ),
        category=performance.category,
        role=performance.role,
    )

    if result is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to map test to a skill",
        )

    return {
        "status": "success",
        "message": "Skill updated from test performance",
        **result,
        "test_score": performance.score,
        "test_type": performance.test_type,
    }


# ============================================================
# GET SINGLE SKILL
# ============================================================


@router.get("/{skill_id}")
def get_skill(
    skill_id: str,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    if not ObjectId.is_valid(skill_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid skill ID",
        )

    skill = skill_progress_collection.find_one(
        {
            "_id": ObjectId(skill_id),
            "user_id": current_user_id,
        }
    )

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    skill["_id"] = str(
        skill["_id"]
    )

    return {
        "status": "success",
        "skill": skill,
    }


# ============================================================
# UPDATE SINGLE SKILL
# ============================================================


@router.patch("/{skill_id}")
def update_skill(
    skill_id: str,
    skill_data: SkillProgressUpdate,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    if not ObjectId.is_valid(skill_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid skill ID",
        )

    update_data = {}

    if skill_data.level is not None:
        update_data["level"] = (
            skill_data.level
        )

    if skill_data.progress is not None:
        update_data["progress"] = (
            skill_data.progress
        )

    if skill_data.evidence is not None:
        update_data["evidence"] = (
            skill_data.evidence
        )

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No update fields provided",
        )

    update_data["updated_at"] = (
        datetime.now(timezone.utc)
    )

    result = skill_progress_collection.update_one(
        {
            "_id": ObjectId(skill_id),
            "user_id": current_user_id,
        },
        {
            "$set": update_data
        },
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    return {
        "status": "success",
        "message": "Skill progress updated",
        "skill_id": skill_id,
    }


# ============================================================
# DELETE SINGLE SKILL
# ============================================================


@router.delete("/{skill_id}")
def delete_skill(
    skill_id: str,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    if not ObjectId.is_valid(skill_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid skill ID",
        )

    result = skill_progress_collection.delete_one(
        {
            "_id": ObjectId(skill_id),
            "user_id": current_user_id,
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    return {
        "status": "success",
        "message": "Skill deleted successfully",
    }