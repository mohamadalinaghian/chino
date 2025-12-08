# api/endpoints/auth.py
"""
Django Ninja endpoints for authentication.

Endpoints:
- POST /auth/login   -> Login with mobile/password, returns JWT tokens
- POST /auth/refresh -> Exchange refresh token for new token pair
- GET  /auth/me      -> Get authenticated user profile (requires access token)
- POST /auth/logout  -> Logout (stateless - client deletes tokens)

All business logic is delegated to api/security/auth.py (AuthService).
"""

from http import HTTPStatus

from api.security.auth import AuthService, jwt_auth
from ninja import Router
from ninja.errors import HttpError

from ..schemas.auth_schemas import LoginIn, LogoutOut, RefreshIn, TokenOut, UserOut

router = Router(tags=["auth"])


@router.post("/login", response=TokenOut, summary="Login with mobile and password")
def login(request, payload: LoginIn):
    """
    Authenticate user with mobile number and password.

    Returns a pair of JWT tokens (access + refresh) on success.

    Args:
        payload: LoginIn schema with mobile and password

    Returns:
        TokenOut: Access and refresh tokens

    Raises:
        HttpError 401: Invalid credentials
        HttpError 500: Internal server error
    """
    try:
        return AuthService.login(payload.mobile, payload.password)
    except HttpError:
        # Re-raise HttpError to let Ninja format it properly
        raise
    except Exception as e:
        # Log unexpected errors and return 500
        # In production, use proper logging
        print(f"Login error: {e}")
        raise HttpError(int(HTTPStatus.INTERNAL_SERVER_ERROR), "Internal server error")


@router.post("/refresh", response=TokenOut, summary="Refresh access token")
def refresh(request, payload: RefreshIn):
    """
    Exchange a refresh token for a new token pair.

    This endpoint allows clients to get a new access token without
    requiring the user to login again.

    Args:
        payload: RefreshIn schema with refresh token

    Returns:
        TokenOut: New access and refresh tokens

    Raises:
        HttpError 401: Invalid or expired refresh token
        HttpError 500: Internal server error
    """
    try:
        return AuthService.refresh_tokens(payload.refresh)
    except HttpError:
        raise
    except Exception as e:
        print(f"Refresh error: {e}")
        raise HttpError(int(HTTPStatus.INTERNAL_SERVER_ERROR), "Internal server error")


@router.get("/me", auth=jwt_auth, response=UserOut, summary="Get current user profile")
def me(request):
    """
    Get the authenticated user's profile information.

    Requires a valid access token in the Authorization header:
    Authorization: Bearer <access_token>

    Returns:
        UserOut: User profile data

    Raises:
        HttpError 401: Missing or invalid access token (handled by jwt_auth)
    """
    # jwt_auth sets request.auth to the User instance
    user = request.auth

    if not user:
        raise HttpError(int(HTTPStatus.UNAUTHORIZED), "Authentication required")

    return {
        "id": user.id,
        "mobile": user.mobile,
        "name": user.name,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    }


@router.post("/logout", response=LogoutOut, summary="Logout user")
def logout(request):
    """
    Logout endpoint for stateless JWT authentication.

    Since JWTs are stateless, this endpoint simply instructs the client
    to delete their tokens. The tokens will expire naturally based on their TTL.

    For enhanced security, you could implement token blacklisting:
    1. Store token JTI (JWT ID) in Redis/database
    2. Check blacklist on each request
    3. Add tokens to blacklist on logout

    Returns:
        LogoutOut: Success confirmation
    """
    # In a stateless implementation, we just tell the client to delete tokens
    # For token blacklisting, add logic here to invalidate the token

    return {"success": True, "message": "Tokens should be deleted on client side"}
