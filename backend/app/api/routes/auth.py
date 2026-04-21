from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, EmailStr
from jose import jwt
from datetime import datetime, timedelta
from app.core.config import get_settings
from app.core.json_storage import register_user, verify_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 168  # 7 days


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)
    password: str = Field(..., min_length=4, max_length=200)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)
    password: str = Field(..., min_length=4, max_length=200)


class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    email: str


def _create_token(user: dict) -> str:
    settings = get_settings()
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user.get("role", "user"),
        "aud": "authenticated",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, settings.supabase_jwt_secret, algorithm=JWT_ALGORITHM)


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterRequest):
    user = register_user(body.email, body.password)
    if not user:
        raise HTTPException(status_code=409, detail="Email already registered")

    token = _create_token(user)
    return AuthResponse(access_token=token, user_id=user["id"], email=user["email"])


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    user = verify_user(body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = _create_token(user)
    return AuthResponse(access_token=token, user_id=user["id"], email=user["email"])
