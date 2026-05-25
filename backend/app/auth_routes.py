from fastapi import APIRouter, HTTPException, status
from pymongo.errors import DuplicateKeyError
from app.models import UserRegister, UserLogin, TokenResponse
from app.database import users_collection
from app.auth import hash_password, verify_password, create_access_token

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post("/register", status_code=201)
def register(user: UserRegister):
    """Register a new user."""
    try:
        users_collection.insert_one({
            "name": user.name,
            "email": user.email,
            "password": hash_password(user.password),
        })
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    return {"message": f"Account created for {user.name} 🎉"}


@auth_router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin):
    """Login and receive a JWT access token."""
    user = users_collection.find_one({"email": credentials.email})

    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    token = create_access_token({"sub": user["email"], "name": user["name"]})
    return {"access_token": token, "token_type": "bearer"}
