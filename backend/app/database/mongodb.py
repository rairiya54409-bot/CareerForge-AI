
import os
from pathlib import Path

import certifi
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError

# Load backend/.env regardless of the terminal's working directory.
BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BACKEND_DIR / ".env"
load_dotenv(ENV_FILE)

MONGODB_URI = os.getenv("MONGODB_URI", "").strip()
DATABASE_NAME = os.getenv("DATABASE_NAME", "careerforge").strip()

if not MONGODB_URI:
    raise RuntimeError(
        f"MONGODB_URI is missing. Configure it in: {ENV_FILE}"
    )

if not DATABASE_NAME:
    raise RuntimeError("DATABASE_NAME cannot be empty.")

# Create the MongoDB Atlas client.
# TLS certificate verification remains enabled.
client = MongoClient(
    MONGODB_URI,
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=15000,
    connectTimeoutMS=15000,
    socketTimeoutMS=20000,
    retryWrites=True,
    retryReads=True,
    appname="CareerForge-AI",
)

db = client[DATABASE_NAME]

# Existing CareerForge collections
users_collection = db["users"]
resumes_collection = db["resumes"]
applications_collection = db["applications"]
skill_progress_collection = db["skill_progress"]


def check_database_connection():
    """Check connectivity and return a diagnostic result."""
    try:
        client.admin.command("ping")

        return {
            "status": "connected",
            "database": DATABASE_NAME,
            "message": "MongoDB connection successful.",
        }

    except PyMongoError as exc:
        # Return the error for local diagnostics; do not expose it publicly.
        print(f"MongoDB connection failed: {type(exc).__name__}: {exc}")

        return {
            "status": "error",
            "database": DATABASE_NAME,
            "error_type": type(exc).__name__,
            "message": str(exc),
        }


def close_database_connection():
    """Close the MongoDB client when shutting down the application."""
    client.close()
