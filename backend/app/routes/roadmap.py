from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List

from app.routes.auth import get_current_user_id


router = APIRouter(
    prefix="/api/roadmap",
    tags=["Learning Roadmap"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class RoadmapRequest(BaseModel):
    missing_skills: List[str] = []
    recommended_roles: List[str] = []
    career_interests: List[str] = []


# ============================================================
# NORMALIZATION
# ============================================================

def normalize(skill: str) -> str:
    return (
        str(skill)
        .lower()
        .replace("/", " ")
        .replace("-", " ")
        .replace("_", " ")
        .strip()
    )


# ============================================================
# SKILL INFORMATION
# ============================================================

def get_skill_info(skill: str):

    text = normalize(skill)

    # --------------------------------------------------------
    # PANDAS / NUMPY
    # --------------------------------------------------------

    if "pandas" in text or "numpy" in text:

        return {
            "skill": skill,
            "phase": 1,
            "category": "Data Foundations",
            "level": "Beginner",
            "duration": "2–3 weeks",
            "description": (
                "Learn data manipulation, cleaning, "
                "arrays and DataFrame-based analysis."
            ),
        }


    # --------------------------------------------------------
    # EXCEL
    # --------------------------------------------------------

    if "excel" in text:

        return {
            "skill": skill,
            "phase": 2,
            "category": "Business Analytics",
            "level": "Intermediate",
            "duration": "2–3 weeks",
            "description": (
                "Develop advanced spreadsheet skills "
                "for analysis, reporting and dashboards."
            ),
        }


    # --------------------------------------------------------
    # A/B TESTING / HYPOTHESIS TESTING
    # --------------------------------------------------------

    if (
        "a/b" in text
        or "hypothesis" in text
        or "testing" in text
    ):

        return {
            "skill": skill,
            "phase": 3,
            "category": "Statistics",
            "level": "Intermediate",
            "duration": "2 weeks",
            "description": (
                "Build statistical reasoning through "
                "hypothesis testing and experimentation."
            ),
        }


    # --------------------------------------------------------
    # MACHINE LEARNING
    # --------------------------------------------------------

    if (
        "scikit" in text
        or "machine learning" in text
    ):

        return {
            "skill": skill,
            "phase": 4,
            "category": "Machine Learning",
            "level": "Intermediate",
            "duration": "3–4 weeks",
            "description": (
                "Learn practical machine-learning "
                "workflows using Scikit-learn."
            ),
        }


    # --------------------------------------------------------
    # CLOUD
    # --------------------------------------------------------

    if (
        "aws" in text
        or "gcp" in text
        or "cloud" in text
    ):

        return {
            "skill": skill,
            "phase": 5,
            "category": "Cloud",
            "level": "Beginner",
            "duration": "2–3 weeks",
            "description": (
                "Understand cloud fundamentals and "
                "deploy analytics workflows."
            ),
        }


    # --------------------------------------------------------
    # DEFAULT
    # --------------------------------------------------------

    return {
        "skill": skill,
        "phase": 6,
        "category": "Professional Development",
        "level": "Intermediate",
        "duration": "2–3 weeks",
        "description": (
            "Develop this skill to strengthen your "
            "profile for the recommended career roles."
        ),
    }


# ============================================================
# GENERATE ROADMAP
# ============================================================

@router.post("/generate")
async def generate_roadmap(
    request: RoadmapRequest,
    current_user_id: str = Depends(get_current_user_id),
):

    roadmap = []

    for skill in request.missing_skills:

        roadmap.append(
            get_skill_info(skill)
        )


    # --------------------------------------------------------
    # SORT BY LEARNING PHASE
    # --------------------------------------------------------

    roadmap.sort(
        key=lambda item: item["phase"]
    )


    total_phases = len(roadmap)


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "message": (
            "Personalized learning roadmap "
            "generated successfully"
        ),

        "target_roles":
            request.recommended_roles,

        "career_interests":
            request.career_interests,

        "total_skills":
            len(roadmap),

        "total_phases":
            total_phases,

        "roadmap":
            roadmap,
    }