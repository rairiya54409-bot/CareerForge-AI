from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.database.mongodb import resumes_collection
from app.routes.auth import get_current_user_id
from app.services.ai_resume_analyzer import analyze_resume_with_ai


router = APIRouter(
    prefix="/api/analysis",
    tags=["Resume Analysis"],
)


# --------------------------------------------------
# REQUEST MODEL
# --------------------------------------------------

class ResumeAnalysisRequest(BaseModel):
    text: str
    resume_filename: str | None = None


# --------------------------------------------------
# ANALYZE RESUME TEXT
# --------------------------------------------------

@router.post("/resume")
def analyze_resume(
    request: ResumeAnalysisRequest,
    current_user_id: str = Depends(get_current_user_id),
):

    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Resume text cannot be empty",
        )

    try:
        # --------------------------------------------------
        # SEND RESUME TEXT TO GEMINI
        # --------------------------------------------------

        ai_analysis = analyze_resume_with_ai(
            request.text.strip()
        )

        # --------------------------------------------------
        # SAVE ANALYSIS TO MONGODB
        # --------------------------------------------------

        document = {
            "user_id": current_user_id,
            "resume_filename": request.resume_filename,
            "resume_text": request.text.strip(),
            "analysis": ai_analysis,
            "created_at": datetime.now(timezone.utc),
        }

        result = resumes_collection.insert_one(
            document
        )

        return {
            "status": "success",
            "message": "Resume analyzed successfully",
            "analysis_id": str(result.inserted_id),
            "analysis": ai_analysis,
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Resume analysis error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to analyze resume",
        )


# --------------------------------------------------
# GET SAVED RESUME ANALYSIS
# --------------------------------------------------

@router.get("/resume/{analysis_id}")
def get_resume_analysis(
    analysis_id: str,
    current_user_id: str = Depends(get_current_user_id),
):

    # --------------------------------------------------
    # VALIDATE MONGODB OBJECT ID
    # --------------------------------------------------

    if not ObjectId.is_valid(analysis_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid analysis ID",
        )

    try:

        # --------------------------------------------------
        # GET ONLY THE CURRENT USER'S ANALYSIS
        # --------------------------------------------------

        document = resumes_collection.find_one(
            {
                "_id": ObjectId(analysis_id),
                "user_id": current_user_id,
            }
        )

        # --------------------------------------------------
        # ANALYSIS NOT FOUND / NOT OWNED
        # --------------------------------------------------

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Resume analysis not found",
            )

        # --------------------------------------------------
        # CONVERT OBJECT ID TO STRING
        # --------------------------------------------------

        document["_id"] = str(
            document["_id"]
        )

        return {
            "status": "success",
            "analysis": document,
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Get resume analysis error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve resume analysis",
        )