from typing import List, Dict, Any


# ---------------------------------------------------------
# SKILL ALIASES
# ---------------------------------------------------------
# Different names can represent the same skill.

SKILL_ALIASES = {
    "powerbi": "power bi",
    "power bi": "power bi",

    "scikit learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "scikit-learn": "scikit-learn",

    "numpy": "numpy",
    "pandas": "pandas",

    "machine learning": "machine learning",
    "ml": "machine learning",

    "aws": "aws",
    "amazon web services": "aws",

    "gcp": "gcp",
    "google cloud": "gcp",

    "ms excel": "excel",
    "microsoft excel": "excel",
    "advanced excel": "excel",
    "excel": "excel",

    "sql": "sql",
    "python": "python",
    "java": "java",
    "javascript": "javascript",
}


# ---------------------------------------------------------
# TEXT NORMALIZATION
# ---------------------------------------------------------

def normalize_text(value: str) -> str:
    """
    Normalize text for comparison.
    """

    if not value:
        return ""

    return (
        value
        .strip()
        .lower()
        .replace("_", " ")
    )


# ---------------------------------------------------------
# SKILL NORMALIZATION
# ---------------------------------------------------------

def normalize_skill(skill: str) -> str:
    """
    Convert a skill into its canonical form.
    """

    normalized = normalize_text(skill)

    return SKILL_ALIASES.get(
        normalized,
        normalized
    )


def normalize_skills(skills: List[str]) -> set:
    """
    Normalize a list of skills.
    """

    return {
        normalize_skill(skill)
        for skill in skills
        if skill and skill.strip()
    }


# ---------------------------------------------------------
# ROLE MATCHING
# ---------------------------------------------------------

def calculate_role_score(
    recommended_roles: List[str],
    job_title: str
) -> int:

    if not recommended_roles or not job_title:
        return 0

    job_title_normalized = normalize_text(job_title)

    best_score = 0

    for role in recommended_roles:

        role_normalized = normalize_text(role)

        # Exact match
        if role_normalized == job_title_normalized:
            best_score = max(best_score, 100)
            continue

        role_words = set(role_normalized.split())
        title_words = set(job_title_normalized.split())

        common_words = role_words.intersection(title_words)

        if not role_words:
            continue

        overlap = len(common_words) / len(role_words)

        if overlap >= 0.75:
            score = 85

        elif overlap >= 0.50:
            score = 70

        elif overlap > 0:
            score = 50

        else:
            score = 0

        best_score = max(best_score, score)

    return best_score


# ---------------------------------------------------------
# CAREER INTEREST MATCHING
# ---------------------------------------------------------

def calculate_interest_score(
    career_interests: List[str],
    job: Dict[str, Any]
) -> int:

    if not career_interests:
        return 0

    job_text = normalize_text(
        " ".join(
            [
                job.get("title", ""),
                job.get("description", ""),
                " ".join(job.get("skills", []))
            ]
        )
    )

    best_score = 0

    for interest in career_interests:

        interest_normalized = normalize_text(interest)

        if not interest_normalized:
            continue

        # Exact phrase found
        if interest_normalized in job_text:
            best_score = max(best_score, 100)
            continue

        # Partial word matching
        interest_words = set(
            interest_normalized.split()
        )

        matching_words = [
            word
            for word in interest_words
            if word in job_text
        ]

        if matching_words:

            overlap = (
                len(matching_words)
                / len(interest_words)
            )

            if overlap >= 0.75:
                score = 80

            elif overlap >= 0.50:
                score = 60

            else:
                score = 40

            best_score = max(best_score, score)

    return best_score


# ---------------------------------------------------------
# MAIN JOB MATCH CALCULATION
# ---------------------------------------------------------

def calculate_job_match(
    user_skills: List[str],
    recommended_roles: List[str],
    career_interests: List[str],
    job: Dict[str, Any],
) -> Dict[str, Any]:

    # -----------------------------------------------------
    # NORMALIZE USER + JOB SKILLS
    # -----------------------------------------------------

    user_skill_set = normalize_skills(
        user_skills
    )

    job_skill_set = normalize_skills(
        job.get("skills", [])
    )

    # -----------------------------------------------------
    # FIND MATCHING + MISSING SKILLS
    # -----------------------------------------------------

    matching_skills = sorted(
        user_skill_set.intersection(
            job_skill_set
        )
    )

    missing_skills = sorted(
        job_skill_set - user_skill_set
    )

    # -----------------------------------------------------
    # SKILL SCORE
    # -----------------------------------------------------

    if job_skill_set:

        skill_score = (
            len(matching_skills)
            / len(job_skill_set)
        ) * 100

    else:

        skill_score = 0

    # -----------------------------------------------------
    # ROLE SCORE
    # -----------------------------------------------------

    role_score = calculate_role_score(
        recommended_roles,
        job.get("title", "")
    )

    # -----------------------------------------------------
    # INTEREST SCORE
    # -----------------------------------------------------

    interest_score = calculate_interest_score(
        career_interests,
        job
    )

    # -----------------------------------------------------
    # MISSING SKILL PENALTY
    # -----------------------------------------------------

    if job_skill_set:

        missing_ratio = (
            len(missing_skills)
            / len(job_skill_set)
        )

    else:

        missing_ratio = 1

    missing_skill_penalty = missing_ratio * 100

    # -----------------------------------------------------
    # FINAL SCORE
    # -----------------------------------------------------

    final_score = (
        skill_score * 0.50
        + role_score * 0.25
        + interest_score * 0.15
        + (100 - missing_skill_penalty) * 0.10
    )

    final_score = round(
        max(0, min(100, final_score))
    )

    # -----------------------------------------------------
    # MATCH LEVEL
    # -----------------------------------------------------

    if final_score >= 85:

        match_level = "Excellent Match"
        reason = (
            "Your skills, target roles and career "
            "interests strongly align with this job."
        )

    elif final_score >= 70:

        match_level = "Strong Match"
        reason = (
            "This job aligns well with your current "
            "skills and career direction."
        )

    elif final_score >= 50:

        match_level = "Moderate Match"
        reason = (
            "This job is relevant, but you may need "
            "to develop some additional skills."
        )

    else:

        match_level = "Low Match"
        reason = (
            "This job has limited alignment with "
            "your current profile."
        )

    # -----------------------------------------------------
    # RETURN RESULT
    # -----------------------------------------------------

    return {
        "match_score": final_score,
        "match_level": match_level,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "skill_score": round(skill_score),
        "role_score": role_score,
        "interest_score": interest_score,
        "reason": reason,
    }


# ---------------------------------------------------------
# RANK JOBS
# ---------------------------------------------------------

def rank_jobs(
    user_skills: List[str],
    recommended_roles: List[str],
    career_interests: List[str],
    jobs: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:

    ranked_jobs = []

    for job in jobs:

        match_result = calculate_job_match(
            user_skills=user_skills,
            recommended_roles=recommended_roles,
            career_interests=career_interests,
            job=job,
        )

        job_result = {
            **job,
            **match_result,
        }

        ranked_jobs.append(job_result)

    # Highest score first
    ranked_jobs.sort(
        key=lambda job: job["match_score"],
        reverse=True,
    )

    return ranked_jobs