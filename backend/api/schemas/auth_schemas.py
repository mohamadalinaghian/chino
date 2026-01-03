# api/schemas/auth_schemas.py
"""
Request and Response schemas for authentication endpoints.
All schemas are type-safe and validated by Ninja.
"""

from typing import List, Optional

from ninja import Schema


class LoginRequest(Schema):
    """
    User credentials for authentication.

    Attributes:
        mobile: User's unique username
        password: User's password (will be hashed)
    """

    mobile: str
    password: str


class TokenPairResponse(Schema):
    """
    JWT token pair returned after successful authentication.

    Attributes:
        access: Short-lived token for API requests (30 min)
        refresh: Long-lived token for obtaining new access tokens (7 days)
        token_type: Always "Bearer" for HTTP Authorization header
    """

    access: str
    refresh: str
    token_type: str = "Bearer"


class RefreshTokenRequest(Schema):
    """
    Request to obtain a new access token using refresh token.

    Attributes:
        refresh: The refresh token obtained during login
    """

    refresh: str


class AccessTokenResponse(Schema):
    """
    New access token returned after successful refresh.

    Attributes:
        access: Fresh access token
        token_type: Always "Bearer"
    """

    access: str
    token_type: str = "Bearer"


class UserInfoResponse(Schema):
    """
    Current authenticated user's information and permissions.

    Attributes:
        id: User's unique identifier
        mobile: User's username
        email: User's email address
        name: User's full name
        is_staff: Whether user has staff privileges
        is_superuser: Whether user is a superuser
        permissions: List of permission codenames (e.g., "sale.open_sale")
    """

    id: int
    mobile: str
    name: str
    is_staff: bool
    is_superuser: bool
    permissions: List[str]


class ErrorResponse(Schema):
    """
    Standard error response format for all endpoints.

    Attributes:
        detail: Human-readable error message
        code: Optional machine-readable error code for client handling
    """

    detail: str
    code: Optional[str] = None


class ChangePasswordRequest(Schema):
    """
    Request to change user's password.

    Attributes:
        old_password: Current password for verification
        new_password: New password to set
    """

    old_password: str
    new_password: str


class ChangePasswordResponse(Schema):
    """
    Response after successful password change.

    Attributes:
        detail: Success message
    """

    detail: str = "Password changed successfully"
