
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
import logging
import zipfile

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)

from app.database.mongodb import resumes_collection
from app.routes.auth import get_current_user_id
from app.services.resume_parser import extract_resume_text
from app.services.ai_resume_analyzer import analyze_resume_with_ai


router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"],
)

logger = logging.getLogger(__name__)

# =========================================================
# UPLOAD CONFIGURATION
# =========================================================

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx"}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


# =========================================================
# FILE VALIDATION
# =========================================================

def validate_file_content(file_path: Path, extension: str):

    if extension == ".pdf":
        with file_path.open("rb") as f:
            header = f.read(5)

        if header != b"%PDF-":
            raise HTTPException(
                status_code=400,
                detail="Invalid PDF file",
            )

    elif extension == ".docx":
        try:
            with zipfile.ZipFile(file_path) as archive:
                if "word/document.xml" not in archive.namelist():
                    raise HTTPException(
                        status_code=400,
                        detail="Invalid DOCX file",
                    )

        except (zipfile.BadZipFile, OSError):
            raise HTTPException(
                status_code=400,
                detail="Invalid DOCX file",
            )


# =========================================================
# UPLOAD + ANALYZE RESUME
# =========================================================

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user_id),
):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected",
        )

    original_filename = Path(
        file.filename.replace("\\", "/")
    ).name

    extension = Path(original_filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported",
        )

    unique_filename = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / unique_filename

    try:
        # -------------------------------------------------
        # READ FILE WITH SIZE LIMIT
        # -------------------------------------------------

        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty",
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Resume must be smaller than 5 MB",
            )

        # -------------------------------------------------
        # SAVE FILE
        # -------------------------------------------------

        file_path.write_bytes(content)

        # -------------------------------------------------
        # VALIDATE FILE CONTENT
        # -------------------------------------------------

        validate_file_content(file_path, extension)

        # -------------------------------------------------
        # EXTRACT RESUME TEXT
        # -------------------------------------------------

        try:
            resume_text = extract_resume_text(
                str(file_path)
            )

        except Exception:
            logger.exception("Resume extraction failed")

            raise HTTPException(
                status_code=422,
                detail="Unable to extract resume text",
            )

        if not resume_text or not resume_text.strip():
            raise HTTPException(
                status_code=422,
                detail="No readable text found in resume",
            )

        # -------------------------------------------------
        # AI ANALYSIS
        # -------------------------------------------------

        try:
            analysis = analyze_resume_with_ai(
                resume_text
            )

        except Exception:
            logger.exception("AI resume analysis failed")

            raise HTTPException(
                status_code=502,
                detail="Resume analysis service failed",
            )

        # -------------------------------------------------
        # SAVE TO MONGODB
        # -------------------------------------------------

        document = {
            "user_id": current_user_id,
            "resume_filename": original_filename,
            "stored_filename": unique_filename,
            "resume_text": resume_text,
            "analysis": analysis,
            "created_at": datetime.now(timezone.utc),
        }

        try:
            result = resumes_collection.insert_one(
                document
            )

        except Exception:
            logger.exception("Resume database save failed")

            raise HTTPException(
                status_code=500,
                detail="Unable to save resume analysis",
            )

        analysis_id = str(result.inserted_id)

        # -------------------------------------------------
        # RETURN RESULT
        # -------------------------------------------------

        return {
            "status": "success",
            "message": (
                "Resume uploaded, analyzed and "
                "saved successfully"
            ),
            "analysis_id": analysis_id,
            "filename": original_filename,
            "file_type": extension,
            "analysis": analysis,
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Unexpected resume upload error")

        raise HTTPException(
            status_code=500,
            detail="Resume upload failed",
        )

    finally:
        await file.close()

        # Delete temporary file after processing
        try:
            file_path.unlink(missing_ok=True)
        except OSError:
            logger.warning(
                "Unable to delete temporary resume file"
            )
