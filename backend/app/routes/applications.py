from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, field_validator

from app.database.mongodb import applications_collection
from app.routes.auth import get_current_user_id


router = APIRouter(
    prefix="/api/applications",
    tags=["Application Tracker"],
)


class ApplicationCreate(BaseModel):
    analysis_id: str | None = None

    job_id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    company: str = Field(..., min_length=1)

    location: str | None = None
    job_type: str | None = None
    work_model: str | None = None

    match_score: float | None = None

    job_url: str | None = None

    notes: str | None = None

    @field_validator(
        "job_id",
        "title",
        "company",
    )
    @classmethod
    def validate_required_strings(
        cls,
        value: str,
    ) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Field cannot be empty"
            )

        return value


class ApplicationStatusUpdate(BaseModel):
    status: str


VALID_STATUSES = {
    "Applied",
    "Interview",
    "Offer",
    "Rejected",
    "Withdrawn",
}


@router.post("")
def create_application(
    application: ApplicationCreate,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):

    existing = applications_collection.find_one(
        {
            "job_id": application.job_id,
            "user_id": current_user_id,
        }
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Application already exists for this job",
        )

    document = {
        "user_id": current_user_id,
        "analysis_id": application.analysis_id,

        "job_id": application.job_id,
        "title": application.title,
        "company": application.company,
        "location": application.location,
        "job_type": application.job_type,
        "work_model": application.work_model,

        "match_score": application.match_score,

        "job_url": application.job_url,

        "status": "Applied",

        "notes": application.notes,

        "applied_at": datetime.now(
            timezone.utc
        ),

        "updated_at": datetime.now(
            timezone.utc
        ),
    }

    result = applications_collection.insert_one(
        document
    )

    return {
        "status": "success",
        "message": "Application added successfully",
        "application_id": str(
            result.inserted_id
        ),
    }


@router.get("")
def get_applications(
    current_user_id: str = Depends(
        get_current_user_id
    ),
):

    query = {
        "user_id": current_user_id
    }

    applications = list(
        applications_collection.find(
            query
        ).sort(
            "applied_at",
            -1,
        )
    )

    for application in applications:
        application["_id"] = str(
            application["_id"]
        )

    return {
        "status": "success",
        "total_applications": len(
            applications
        ),
        "applications": applications,
    }


@router.get("/{application_id}")
def get_application(
    application_id: str,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):

    if not ObjectId.is_valid(
        application_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid application ID",
        )

    application = applications_collection.find_one(
        {
            "_id": ObjectId(
                application_id
            ),
            "user_id": current_user_id,
        }
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    application["_id"] = str(
        application["_id"]
    )

    return {
        "status": "success",
        "application": application,
    }


@router.patch("/{application_id}/status")
def update_application_status(
    application_id: str,
    request: ApplicationStatusUpdate,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):

    if not ObjectId.is_valid(
        application_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid application ID",
        )

    if request.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. "
                "Allowed statuses: "
                + ", ".join(
                    sorted(
                        VALID_STATUSES
                    )
                )
            ),
        )

    result = applications_collection.update_one(
        {
            "_id": ObjectId(
                application_id
            ),
            "user_id": current_user_id,
        },
        {
            "$set": {
                "status": request.status,
                "updated_at": datetime.now(
                    timezone.utc
                ),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    return {
        "status": "success",
        "message": "Application status updated",
        "application_id": application_id,
        "new_status": request.status,
    }


@router.delete("/{application_id}")
def delete_application(
    application_id: str,
    current_user_id: str = Depends(
        get_current_user_id
    ),
):

    if not ObjectId.is_valid(
        application_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid application ID",
        )

    result = applications_collection.delete_one(
        {
            "_id": ObjectId(
                application_id
            ),
            "user_id": current_user_id,
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    return {
        "status": "success",
        "message": "Application deleted successfully",
    }