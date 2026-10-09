from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional

from app.routes.auth import get_current_user_id


router = APIRouter(
    prefix="/api/courses",
    tags=["Courses"],
)


# ============================================================
# REQUEST / RESPONSE MODELS
# ============================================================

class CourseRequest(BaseModel):
    missing_skills: List[str] = []
    recommended_roles: List[str] = []
    career_interests: List[str] = []


class Course(BaseModel):
    title: str
    platform: str
    skill: str
    type: str
    level: str
    reason: str
    url: Optional[str] = None
    relevance_score: Optional[int] = None


# ============================================================
# COURSE DATABASE
# ============================================================

COURSES = [

    # --------------------------------------------------------
    # PANDAS / NUMPY
    # --------------------------------------------------------

    {
        "title": "Python for Data Analysis: Pandas & NumPy",
        "platform": "Coursera",
        "skill": "Pandas / NumPy",
        "type": "Free",
        "level": "Beginner",
        "reason": (
            "Build practical foundations in NumPy and "
            "Pandas for data analysis."
        ),
        "url": (
            "https://www.coursera.org/projects/"
            "python-for-data-analysis-numpy"
        ),
    },

    {
        "title": "Pandas for Data Science",
        "platform": "Coursera",
        "skill": "Pandas / NumPy",
        "type": "Paid",
        "level": "Intermediate",
        "reason": (
            "Develop deeper Pandas skills for cleaning, "
            "transforming and analyzing datasets."
        ),
        "url": (
            "https://www.coursera.org/learn/"
            "pandas-data-science"
        ),
    },


    # --------------------------------------------------------
    # SCIKIT-LEARN
    # --------------------------------------------------------

    {
        "title": (
            "Introduction to Data Science and "
            "scikit-learn in Python"
        ),
        "platform": "Coursera",
        "skill": "Scikit-learn",
        "type": "Free",
        "level": "Beginner",
        "reason": (
            "Learn the foundations of data science and "
            "machine-learning workflows using Python."
        ),
        "url": (
            "https://www.coursera.org/learn/"
            "data-science-and-scikit-learn-in-python"
        ),
    },

    {
        "title": "Machine Learning with Scikit-learn",
        "platform": "Coursera",
        "skill": "Scikit-learn",
        "type": "Paid",
        "level": "Intermediate",
        "reason": (
            "Strengthen practical machine-learning skills "
            "including preprocessing, training and evaluation."
        ),
        "url": (
            "https://www.coursera.org/courses?"
            "query=scikit-learn"
        ),
    },


    # --------------------------------------------------------
    # ADVANCED EXCEL
    # --------------------------------------------------------

    {
        "title": "Data Visualization with Advanced Excel",
        "platform": "Coursera",
        "skill": "Advanced Excel",
        "type": "Free",
        "level": "Beginner",
        "reason": (
            "Improve Excel-based data visualization and "
            "reporting skills for analytics roles."
        ),
        "url": (
            "https://www.coursera.org/learn/"
            "advanced-excel/"
        ),
    },

    {
        "title": "Excel Skills for Business: Advanced",
        "platform": "Coursera",
        "skill": "Advanced Excel",
        "type": "Paid",
        "level": "Advanced",
        "reason": (
            "Develop advanced formulas, data preparation, "
            "dashboards and business-analysis skills."
        ),
        "url": (
            "https://www.coursera.org/learn/"
            "excel-advanced"
        ),
    },


    # --------------------------------------------------------
    # AWS / GCP
    # --------------------------------------------------------

    {
        "title": "AWS Cloud Practitioner Essentials",
        "platform": "AWS",
        "skill": "Cloud Platforms (AWS / GCP)",
        "type": "Free",
        "level": "Beginner",
        "reason": (
            "Build foundational cloud knowledge and "
            "understand core AWS services."
        ),
        "url": (
            "https://aws.amazon.com/training/digital/"
            "aws-cloud-practitioner-essentials/"
        ),
    },

    {
        "title": "AWS Certified Cloud Practitioner",
        "platform": "AWS",
        "skill": "Cloud Platforms (AWS / GCP)",
        "type": "Paid",
        "level": "Beginner",
        "reason": (
            "Prepare for a recognized AWS credential and "
            "strengthen your cloud fundamentals."
        ),
        "url": (
            "https://aws.amazon.com/certification/"
            "certified-cloud-practitioner/"
        ),
    },


    # --------------------------------------------------------
    # A/B TESTING
    # --------------------------------------------------------

    {
        "title": "Statistics for Data Science with Python",
        "platform": "Coursera",
        "skill": "A/B Testing / Hypothesis Testing",
        "type": "Free",
        "level": "Beginner",
        "reason": (
            "Build statistical foundations including "
            "probability and hypothesis testing."
        ),
        "url": (
            "https://www.coursera.org/learn/"
            "statistics-for-data-science-with-python"
        ),
    },

    {
        "title": "A/B Testing and Experimentation",
        "platform": "Coursera",
        "skill": "A/B Testing / Hypothesis Testing",
        "type": "Paid",
        "level": "Intermediate",
        "reason": (
            "Develop practical experimentation and "
            "statistical decision-making skills."
        ),
        "url": (
            "https://www.coursera.org/search?"
            "query=A%2FB%20testing"
        ),
    },
]


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_skill(skill: str) -> str:
    """
    Convert skill text into a consistent format.
    """

    return (
        str(skill)
        .lower()
        .replace("/", " ")
        .replace("-", " ")
        .replace("_", " ")
        .replace("&", " ")
        .strip()
    )


# ============================================================
# SKILL MATCHING
# ============================================================

def course_matches_skill(
    course_skill: str,
    missing_skill: str,
) -> bool:

    course_text = normalize_skill(course_skill)
    missing_text = normalize_skill(missing_skill)

    # Exact match
    if course_text == missing_text:
        return True

    # Direct keyword matching
    keyword_groups = {

        "pandas": [
            "pandas",
            "numpy",
        ],

        "numpy": [
            "pandas",
            "numpy",
        ],

        "scikit": [
            "scikit",
            "sklearn",
            "machine learning",
        ],

        "sklearn": [
            "scikit",
            "sklearn",
            "machine learning",
        ],

        "excel": [
            "excel",
        ],

        "aws": [
            "cloud",
            "aws",
            "gcp",
        ],

        "gcp": [
            "cloud",
            "aws",
            "gcp",
        ],

        "cloud": [
            "cloud",
            "aws",
            "gcp",
        ],

        "a b": [
            "a b",
            "hypothesis",
            "testing",
        ],

        "hypothesis": [
            "a b",
            "hypothesis",
            "testing",
        ],
    }

    for keyword, targets in keyword_groups.items():

        if keyword in missing_text:

            for target in targets:

                if target in course_text:
                    return True

    return False


# ============================================================
# COURSE RELEVANCE SCORE
# ============================================================

def calculate_course_score(
    course,
    missing_skills,
    recommended_roles,
    career_interests,
):

    score = 0

    course_skill = normalize_skill(
        course["skill"]
    )

    role_text = " ".join(
        str(role).lower()
        for role in recommended_roles
    )

    interest_text = " ".join(
        str(interest).lower()
        for interest in career_interests
    )


    # --------------------------------------------------------
    # SKILL MATCH
    # --------------------------------------------------------

    for skill in missing_skills:

        if course_matches_skill(
            course["skill"],
            skill,
        ):
            score += 50


    # --------------------------------------------------------
    # DATA ANALYTICS RELEVANCE
    # --------------------------------------------------------

    analytics_keywords = [
        "data analyst",
        "business intelligence",
        "business analytics",
        "operations analyst",
        "data science",
        "analytics",
    ]

    is_analytics_profile = any(
        keyword in role_text
        or keyword in interest_text
        for keyword in analytics_keywords
    )

    if is_analytics_profile:

        if any(
            keyword in course_skill
            for keyword in [
                "pandas",
                "numpy",
                "excel",
                "testing",
            ]
        ):
            score += 20


    # --------------------------------------------------------
    # MACHINE LEARNING RELEVANCE
    # --------------------------------------------------------

    ml_keywords = [
        "machine learning",
        "data science",
        "ai",
    ]

    is_ml_profile = any(
        keyword in role_text
        or keyword in interest_text
        for keyword in ml_keywords
    )

    if is_ml_profile:

        if "scikit" in course_skill:
            score += 25


    # --------------------------------------------------------
    # CLOUD RELEVANCE
    # --------------------------------------------------------

    cloud_keywords = [
        "cloud",
        "software engineer",
        "data engineer",
        "machine learning engineer",
    ]

    if any(
        keyword in role_text
        or keyword in interest_text
        for keyword in cloud_keywords
    ):

        if "cloud" in course_skill:
            score += 20


    # --------------------------------------------------------
    # LEVEL BONUS
    # --------------------------------------------------------

    if course["level"] == "Intermediate":
        score += 5

    elif course["level"] == "Advanced":
        score += 3


    # --------------------------------------------------------
    # PAID COURSE BONUS
    # --------------------------------------------------------

    if course["type"] == "Paid":
        score += 2


    return score


# ============================================================
# COURSE RECOMMENDATION API
# ============================================================

@router.post("/recommend")
async def recommend_courses(
    request: CourseRequest,
    current_user_id: str = Depends(get_current_user_id),
):

    recommendations = []
    used_courses = set()


    # --------------------------------------------------------
    # PROCESS EACH MISSING SKILL
    # --------------------------------------------------------

    for missing_skill in request.missing_skills:

        matching_courses = [
            course
            for course in COURSES
            if course_matches_skill(
                course["skill"],
                missing_skill,
            )
        ]


        # ----------------------------------------------------
        # SCORE MATCHING COURSES
        # ----------------------------------------------------

        scored_courses = []

        for course in matching_courses:

            relevance_score = calculate_course_score(
                course,
                request.missing_skills,
                request.recommended_roles,
                request.career_interests,
            )

            scored_courses.append(
                {
                    **course,
                    "relevance_score": relevance_score,
                }
            )


        # Highest score first
        scored_courses.sort(
            key=lambda course:
                course["relevance_score"],
            reverse=True,
        )


        # ----------------------------------------------------
        # ONE FREE COURSE
        # ----------------------------------------------------

        free_course = next(
            (
                course
                for course in scored_courses
                if course["type"] == "Free"
            ),
            None,
        )

        if free_course:

            title = free_course["title"]

            if title not in used_courses:

                recommendations.append(
                    free_course
                )

                used_courses.add(title)


        # ----------------------------------------------------
        # ONE PAID COURSE
        # ----------------------------------------------------

        paid_course = next(
            (
                course
                for course in scored_courses
                if course["type"] == "Paid"
            ),
            None,
        )

        if paid_course:

            title = paid_course["title"]

            if title not in used_courses:

                recommendations.append(
                    paid_course
                )

                used_courses.add(title)


    # --------------------------------------------------------
    # FINAL RANKING
    # --------------------------------------------------------

    recommendations.sort(
        key=lambda course:
            course["relevance_score"],
        reverse=True,
    )


    # --------------------------------------------------------
    # COUNTS
    # --------------------------------------------------------

    free_count = sum(
        1
        for course in recommendations
        if course["type"] == "Free"
    )

    paid_count = sum(
        1
        for course in recommendations
        if course["type"] == "Paid"
    )


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "message": (
            "Personalized course recommendations "
            "generated successfully"
        ),

        "total_courses": len(
            recommendations
        ),

        "free_courses": free_count,

        "paid_courses": paid_count,

        "recommended_courses":
            recommendations,
    }