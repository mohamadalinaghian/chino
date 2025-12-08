# api/schemas/auth.py
from pydantic import BaseModel, Field


class LoginIn(BaseModel):
    username: str = Field(..., example="alice")
    password: str = Field(..., example="strongpassword")


class TokenOut(BaseModel):
    access: str
    refresh: str


class RefreshIn(BaseModel):
    refresh: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str | None = None
    is_staff: bool = False
    is_superuser: bool = False
