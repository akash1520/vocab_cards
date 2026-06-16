from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

UserRole = Literal["user", "admin"]


class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    role: UserRole
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminUserSummary(BaseModel):
    id: str
    email: EmailStr
    role: UserRole
    created_at: datetime
    word_count: int
    due_count: int
