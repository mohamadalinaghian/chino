# api/endpoints/auth_endpoints.py
"""
Authentication endpoints for JWT-based authentication.
Handles login, token refresh, and user info retrieval.
"""

from typing import Union

from api.schemas.auth_schemas import (
    AccessTokenResponse,
    ErrorResponse,
    LoginRequest,
    RefreshTokenRequest,
    TokenPairResponse,
    UserInfoResponse,
)
from api.security.auth import TokenService, jwt_auth
from django.contrib.auth import authenticate, get_user_model
from ninja import Router

User = get_user_model()

# Public router (no authentication required)
router = Router(tags=["Authentication"])


@router.post("/login", response={200: TokenPairResponse, 401: ErrorResponse})
def login(request, payload: LoginRequest) -> Union[tuple[int, dict], TokenPairResponse]:
    """
    Authenticates user and returns JWT token pair.

    Args:
        payload: Username and password credentials

    Returns:
        TokenPairResponse with access and refresh tokens on success
        ErrorResponse with 401 status on failure
    """
    # Authenticate user using Django's authentication backend
    user = authenticate(request, username=payload.username, password=payload.password)

    if user is None:
        return 401, {"detail": "Invalid credentials", "code": "invalid_credentials"}

    if not user.is_active:
        return 401, {"detail": "Account is disabled", "code": "account_disabled"}

    # Generate token pair
    tokens = TokenService.generate_token_pair(user)

    return TokenPairResponse(**tokens)


@router.post("/refresh", response={200: AccessTokenResponse, 401: ErrorResponse})
def refresh_token(
    request, payload: RefreshTokenRequest
) -> Union[tuple[int, dict], AccessTokenResponse]:
    """
    Issues new access token using valid refresh token.

    Args:
        payload: Refresh token

    Returns:
        AccessTokenResponse with new access token on success
        ErrorResponse with 401 status on failure
    """
    # Validate refresh token
    user = TokenService.validate_refresh_token(payload.refresh)

    if user is None:
        return 401, {
            "detail": "Invalid or expired refresh token",
            "code": "invalid_refresh_token",
        }

    # Generate new access token
    access_token = TokenService.generate_access_token(user)

    return AccessTokenResponse(access=access_token)


@router.get("/me", response=UserInfoResponse, auth=jwt_auth)
def get_current_user(request) -> UserInfoResponse:
    """
    Returns information about the currently authenticated user.
    Requires valid JWT access token in Authorization header.

    Returns:
        UserInfoResponse with user details and permissions
    """
    user = request.auth

    # Get user permissions as a list of strings
    permissions = list(user.get_all_permissions())

    return UserInfoResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        is_staff=user.is_staff,
        permissions=permissions,
    )


@router.post("/logout", auth=jwt_auth)
def logout(request) -> dict:
    """
    Logout endpoint (stateless - client should discard tokens).

    Note: Since JWT is stateless, actual logout happens client-side
    by discarding tokens. This endpoint exists for consistency.

    Returns:
        Success message
    """
    return {"detail": "Successfully logged out"}
