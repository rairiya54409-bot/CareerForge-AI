from fastapi import APIRouter

from app.database.mongodb import applications_collection


router = APIRouter(
    prefix="/api/analytics",
    tags=["Career Analytics"],
)


@router.get("/applications")
def get_application_analytics(
    user_id: str | None = None,
):
    """
    Generate career/application analytics
    from the user's application history.
    """

    query = {}

    if user_id:
        query["user_id"] = user_id

    applications = list(
        applications_collection.find(
            query
        )
    )

    total_applications = len(
        applications
    )

    # ------------------------------------------
    # Status counts
    # ------------------------------------------

    status_counts = {
        "Applied": 0,
        "Interview": 0,
        "Offer": 0,
        "Rejected": 0,
        "Withdrawn": 0,
    }

    for application in applications:

        status = application.get(
            "status",
            "Applied",
        )

        if status in status_counts:
            status_counts[status] += 1

    # ------------------------------------------
    # Match score analytics
    # ------------------------------------------

    match_scores = []

    for application in applications:

        score = application.get(
            "match_score"
        )

        if isinstance(
            score,
            (int, float),
        ):
            match_scores.append(
                float(score)
            )

    if match_scores:

        average_match_score = round(
            sum(match_scores)
            / len(match_scores),
            2,
        )

        highest_match_score = max(
            match_scores
        )

        lowest_match_score = min(
            match_scores
        )

    else:

        average_match_score = 0
        highest_match_score = 0
        lowest_match_score = 0

    # ------------------------------------------
    # Conversion rates
    # ------------------------------------------

    if total_applications > 0:

        interview_conversion_rate = round(
            (
                status_counts["Interview"]
                + status_counts["Offer"]
            )
            / total_applications
            * 100,
            2,
        )

        offer_conversion_rate = round(
            status_counts["Offer"]
            / total_applications
            * 100,
            2,
        )

    else:

        interview_conversion_rate = 0
        offer_conversion_rate = 0

    # ------------------------------------------
    # Application insights
    # ------------------------------------------

    insights = []

    if total_applications == 0:

        insights.append(
            "Start applying to jobs to generate career analytics."
        )

    else:

        if average_match_score >= 80:

            insights.append(
                "You are generally applying to jobs "
                "that strongly match your profile."
            )

        elif average_match_score >= 60:

            insights.append(
                "Your average job match is moderate. "
                "Consider prioritizing jobs with stronger profile alignment."
            )

        else:

            insights.append(
                "Your average job match is relatively low. "
                "Focus on roles aligned with your skills and career interests."
            )

        if interview_conversion_rate >= 30:

            insights.append(
                "Your application-to-interview conversion "
                "is strong."
            )

        elif total_applications >= 5:

            insights.append(
                "Your application-to-interview conversion "
                "could be improved."
            )

        if status_counts["Offer"] > 0:

            insights.append(
                "You have received at least one offer."
            )

    return {
        "status": "success",

        "user_id": user_id,

        "overview": {
            "total_applications":
                total_applications,

            "applied":
                status_counts["Applied"],

            "interviews":
                status_counts["Interview"],

            "offers":
                status_counts["Offer"],

            "rejected":
                status_counts["Rejected"],

            "withdrawn":
                status_counts["Withdrawn"],
        },

        "match_score": {
            "average":
                average_match_score,

            "highest":
                highest_match_score,

            "lowest":
                lowest_match_score,
        },

        "conversion_rates": {
            "interview_conversion":
                interview_conversion_rate,

            "offer_conversion":
                offer_conversion_rate,
        },

        "insights": insights,
    }