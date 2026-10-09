from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.mongodb import check_database_connection
from app.routes.auth import router as auth_router
from app.routes.analysis import router as analysis_router
from app.routes.resume import router as resume_router
from app.routes.courses import router as courses_router
from app.routes.roadmap import router as roadmap_router
from app.routes.jobs import router as jobs_router
from app.routes.applications import router as applications_router
from app.routes.analytics import router as analytics_router
from app.routes.chatbot import router as chatbot_router
from app.routes.voice import router as voice_router
from app.routes.skill_progress import router as skill_progress_router
from app.routes.language import router as language_router
from app.routes.test_sessions import router as test_sessions_router
from app.routes.interview import router as interview_router
from app.routes.coding import router as coding_router
from app.routes.aptitude import router as aptitude_router

app = FastAPI(
    title="CareerForge AI",
    description="AI-powered career readiness platform",
    version="1.0.0",
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# ROUTES
# --------------------------------------------------

app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(resume_router)
app.include_router(courses_router)
app.include_router(roadmap_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(analytics_router)
app.include_router(chatbot_router)
app.include_router(voice_router)
app.include_router(skill_progress_router)
app.include_router(language_router)
app.include_router(test_sessions_router)
app.include_router(interview_router)
app.include_router(coding_router)
app.include_router(aptitude_router)

# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "CareerForge AI Backend is running",
        "status": "success",
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CareerForge AI Backend",
    }


# --------------------------------------------------
# DATABASE STATUS
# --------------------------------------------------

@app.get("/api/database-status")
def database_status():
    connected = check_database_connection()

    return {
        "database": "MongoDB Atlas",
        "connected": connected,
    }