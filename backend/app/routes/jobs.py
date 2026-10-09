from typing import List

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.database.mongodb import resumes_collection
from app.routes.auth import get_current_user_id
from app.services.job_matcher import rank_jobs
from app.services.job_provider import get_jobs


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"],
)


class JobRecommendationRequest(BaseModel):
    skills: List[str] = Field(default_factory=list)
    recommended_roles: List[str] = Field(default_factory=list)
    career_interests: List[str] = Field(default_factory=list)


def generate_job_recommendations(
    skills: List[str],
    recommended_roles: List[str],
    career_interests: List[str],
):

    print("=" * 70)
    print("CAREERFORGE JOB RECOMMENDATION")
    print("=" * 70)

    print("SKILLS:", skills)
    print("ROLES:", recommended_roles)
    print("INTERESTS:", career_interests)

    # --------------------------------------------------------
    # GET JOBS
    # --------------------------------------------------------

    try:

        print("Calling get_jobs()...")

        jobs = get_jobs(
            include_internships=True,
            limit=100,
        )

        print(
            "get_jobs() returned:",
            len(jobs)
        )

    except Exception as error:

        import traceback

        print("=" * 70)
        print("JOB PROVIDER ERROR")
        print(
            "TYPE:",
            type(error).__name__
        )
        print(
            "MESSAGE:",
            str(error)
        )

        traceback.print_exc()

        print("=" * 70)

        raise HTTPException(
            status_code=502,
            detail=(
                f"Job provider error: "
                f"{type(error).__name__}: {str(error)}"
            ),
        )

    # --------------------------------------------------------
    # NO JOBS
    # --------------------------------------------------------

    if not jobs:

        print(
            "WARNING: Provider returned zero jobs."
        )

        return []

    print(
        "FIRST JOB:"
    )

    print(
        jobs[0]
    )

    # --------------------------------------------------------
    # MATCH JOBS
    # --------------------------------------------------------

    try:

        print(
            "Calling rank_jobs()..."
        )

        ranked_jobs = rank_jobs(
            user_skills=skills,
            recommended_roles=recommended_roles,
            career_interests=career_interests,
            jobs=jobs,
        )

        print(
            "rank_jobs() returned:",
            len(ranked_jobs)
        )

    except Exception as error:

        import traceback

        print("=" * 70)
        print("JOB MATCHER ERROR")
        print(
            "TYPE:",
            type(error).__name__
        )
        print(
            "MESSAGE:",
            str(error)
        )

        traceback.print_exc()

        print("=" * 70)

        raise HTTPException(
            status_code=500,
            detail=(
                f"Job matcher error: "
                f"{type(error).__name__}: {str(error)}"
            ),
        )

    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    if not ranked_jobs:

        print(
            "Matcher returned zero jobs."
        )

        print(
            "Using provider jobs as fallback."
        )

        fallback_jobs = []

        for job in jobs:

            job_copy = dict(job)

            if "match_score" not in job_copy:
                job_copy["match_score"] = 0

            if "match_reasons" not in job_copy:
                job_copy["match_reasons"] = [
                    "Retrieved from live job provider"
                ]

            fallback_jobs.append(
                job_copy
            )

        ranked_jobs = fallback_jobs

    print(
        "FINAL JOB COUNT:",
        len(ranked_jobs)
    )

    print("=" * 70)

    return ranked_jobs


# ============================================================
# MANUAL PROFILE
# ============================================================

@router.post("/recommend")
def recommend_jobs(
    request: JobRecommendationRequest,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):

    ranked_jobs = generate_job_recommendations(
        skills=request.skills,
        recommended_roles=request.recommended_roles,
        career_interests=request.career_interests,
    )

    return {
        "status": "success",
        "message": (
            "Personalized job recommendations "
            "generated successfully"
        ),
        "total_jobs": len(ranked_jobs),
        "jobs": ranked_jobs,
    }


# ============================================================
# PROFILE
# ============================================================

@router.post("/recommend-from-profile")
def recommend_jobs_from_profile(
    profile: JobRecommendationRequest,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):

    ranked_jobs = generate_job_recommendations(
        skills=profile.skills,
        recommended_roles=profile.recommended_roles,
        career_interests=profile.career_interests,
    )

    return {
        "status": "success",
        "message": (
            "Personalized job recommendations "
            "generated successfully"
        ),
        "candidate_profile": {
            "skills": profile.skills,
            "recommended_roles": profile.recommended_roles,
            "career_interests": profile.career_interests,
        },
        "total_jobs": len(ranked_jobs),
        "jobs": ranked_jobs,
    }


# ============================================================
# RESUME ANALYSIS
# ============================================================

@router.post("/recommend/{analysis_id}")
def recommend_jobs_from_resume(
    analysis_id: str,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):

    # --------------------------------------------------------
    # VALIDATE ANALYSIS ID
    # --------------------------------------------------------

    if not ObjectId.is_valid(
        analysis_id
    ):

        raise HTTPException(
            status_code=400,
            detail="Invalid analysis ID",
        )

    # --------------------------------------------------------
    # FIND USER'S RESUME ANALYSIS
    # --------------------------------------------------------

    try:

        document = resumes_collection.find_one(
            {
                "_id": ObjectId(
                    analysis_id
                ),
                "user_id": current_user_id,
            }
        )

    except Exception as error:

        import traceback

        print("=" * 70)
        print("DATABASE ERROR")
        print(
            type(error).__name__,
            str(error)
        )

        traceback.print_exc()

        print("=" * 70)

        raise HTTPException(
            status_code=500,
            detail=(
                f"Database error: "
                f"{type(error).__name__}: {str(error)}"
            ),
        )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Resume analysis not found",
        )

    # --------------------------------------------------------
    # GET ANALYSIS
    # --------------------------------------------------------

    analysis = document.get(
        "analysis",
        {},
    )

    if not isinstance(
        analysis,
        dict,
    ):

        analysis = {}

    # --------------------------------------------------------
    # GET CANDIDATE DATA
    # --------------------------------------------------------

    technical_skills = analysis.get(
        "technical_skills",
        [],
    )

    recommended_roles = analysis.get(
        "recommended_roles",
        [],
    )

    career_interests = analysis.get(
        "career_interests",
        [],
    )

    # --------------------------------------------------------
    # NORMALIZE DATA
    # --------------------------------------------------------

    if not isinstance(
        technical_skills,
        list,
    ):
        technical_skills = []

    if not isinstance(
        recommended_roles,
        list,
    ):
        recommended_roles = []

    if not isinstance(
        career_interests,
        list,
    ):
        career_interests = []

    technical_skills = [
        str(skill).strip()
        for skill in technical_skills
        if str(skill).strip()
    ]

    recommended_roles = [
        str(role).strip()
        for role in recommended_roles
        if str(role).strip()
    ]

    career_interests = [
        str(interest).strip()
        for interest in career_interests
        if str(interest).strip()
    ]

    # --------------------------------------------------------
    # GENERATE RECOMMENDATIONS
    # --------------------------------------------------------

    try:

        ranked_jobs = generate_job_recommendations(
            skills=technical_skills,
            recommended_roles=recommended_roles,
            career_interests=career_interests,
        )

    except HTTPException:

        raise

    except Exception as error:

        import traceback

        print("=" * 70)
        print("UNEXPECTED JOB ERROR")
        print(
            type(error).__name__,
            str(error)
        )

        traceback.print_exc()

        print("=" * 70)

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unexpected job error: "
                f"{type(error).__name__}: {str(error)}"
            ),
        )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "status": "success",
        "message": (
            "Personalized job recommendations "
            "generated from resume analysis"
        ),
        "analysis_id": analysis_id,
        "candidate_profile": {
            "skills": technical_skills,
            "recommended_roles": recommended_roles,
            "career_interests": career_interests,
        },
        "total_jobs": len(ranked_jobs),
        "jobs": ranked_jobs,
    }