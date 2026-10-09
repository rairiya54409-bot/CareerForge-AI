from datetime import datetime, timedelta, timezone
import os

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.database.mongodb import users_collection
from app.schemas.user import UserLogin, UserRegister


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


# =========================
# JWT CONFIGURATION
# =========================

SECRET_KEY = os.getenv("JWT_SECRET")

if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET is not configured. "
        "Add JWT_SECRET to the backend .env file."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

security = HTTPBearer()


# =========================
# PASSWORD FUNCTIONS
# =========================

def hash_password(password):
    return pwd_context.hash(password)


def verify_password(password, hashed_password):
    return pwd_context.verify(
        password,
        hashed_password,
    )


# =========================
# JWT TOKEN
# =========================

def create_access_token(user_id):
    expire = datetime.now(
        timezone.utc
    ) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# =========================
# AUTHENTICATION DEPENDENCY
# =========================

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )

        return user_id

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )


# =========================
# REGISTER
# =========================

@router.post("/register")
def register(user: UserRegister):

    email = str(user.email).lower()

    existing_user = users_collection.find_one(
        {"email": email}
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user_document = {
        "name": user.name,
        "email": email,
        "password_hash": hash_password(
            user.password
        ),
        "created_at": datetime.now(
            timezone.utc
        ),
    }

    result = users_collection.insert_one(
        user_document
    )

    token = create_access_token(
        str(result.inserted_id)
    )

    return {
        "message": "Registration successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(result.inserted_id),
            "name": user.name,
            "email": email,
        },
    }


# =========================
# LOGIN
# =========================

@router.post("/login")
def login(user: UserLogin):

    email = str(user.email).lower()

    existing_user = users_collection.find_one(
        {"email": email}
    )

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    password_hash = existing_user.get(
        "password_hash"
    )

    if not password_hash:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid user record",
        )

    if not verify_password(
        user.password,
        password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(
        str(existing_user["_id"])
    )

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(existing_user["_id"]),
            "name": existing_user["name"],
            "email": existing_user["email"],
        },
    }