# api/schemas/auth.py
"""
Ninja schemas for authentication endpoints.

These schemas define the request/response structure for auth operations.
"""

from ninja import Field, Schema


class LoginIn(Schema):
    """
    Login request schema.

    Mobile number must be in Iranian format: 09XXXXXXXXX
    """

    mobile: str = Field(
        ...,
        example="09123456789",
        description="Iranian mobile number in format 09XXXXXXXXX",
    )
    password: str = Field(..., example="strongpassword", description="User password")


class TokenOut(Schema):
    """
    JWT token pair response.

    Both access and refresh tokens are returned on successful login/refresh.
    """

    access: str = Field(..., description="Short-lived access token for API requests")
    refresh: str = Field(
        ..., description="Long-lived refresh token for getting new access tokens"
    )


class RefreshIn(Schema):
    """
    Refresh token request schema.
    """

    refresh: str = Field(..., description="Valid refresh token")


class UserOut(Schema):
    """
    User profile response schema.

    Contains basic user information. Does not include sensitive data like password.
    """

    id: int = Field(..., description="User's unique ID")
    mobile: str = Field(..., description="User's mobile number")
    name: str = Field(..., description="User's full name")
    is_staff: bool = Field(default=False, description="Staff status")
    is_superuser: bool = Field(default=False, description="Superuser status")


class LogoutOut(Schema):
    """
    Logout response schema.

    For stateless JWT, this is just a success confirmation.
    Client should delete tokens locally.
    """

    success: bool = Field(default=True, description="Logout successful")
    message: str = Field(
        default="Tokens should be deleted on client side",
        description="Instruction for client",
    )
