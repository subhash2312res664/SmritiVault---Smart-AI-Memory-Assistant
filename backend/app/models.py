from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional


# ─── Item Models ───────────────────────────────────────────

class ItemLog(BaseModel):
    item_name: str = Field(..., min_length=2, max_length=50)
    location: str = Field(..., min_length=2, max_length=100)
    log_type: str = Field(default="manual")
    timestamp: Optional[datetime] = None


class UpdateItem(BaseModel):
    location: str = Field(..., min_length=2, max_length=100)


# ─── Auth Models ───────────────────────────────────────────

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
