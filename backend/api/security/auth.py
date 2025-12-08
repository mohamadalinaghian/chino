# api/security/auth.py
"""
JWT utilities, Ninja HttpBearer auth class, and AuthService.
Single responsibility sections are separated with clear functions/classes.

Design notes:
- Stateless JWT implementation (no DB for tokens).
- Uses RFC7519 standard claims: sub (subject), iat (issued at), exp (expiration).
- Tokens contain minimal data (only user id).
- AuthService provides testable business logic (login & refresh).
"""

from datetime import datetime, timezone
from http import HTTPStatus
from typing import Any, Dict, Optional

import jwt
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.http import HttpRequest
from ninja.errors import HttpError
from ninja.security import HttpBearer

User = get_user_model()


# ---------------------------
# JWT helper & utils
# ---------------------------
class JWTError(Exception):
    """Internal exception for JWT errors."""

    pass


def _now_utc() -> datetime:
    """Return current UTC datetime (timezone-aware)."""
    return datetime.now(tz=timezone.utc)


def _to_ts(dt: datetime) -> int:
    """
    Convert timezone-aware datetime to UNIX timestamp (int seconds).
    Used for 'exp' and 'iat' claims.
    """
    return int(dt.timestamp())


def create_access_token(user: User) -> str:
    """
    Create an access token. Short-lived.
    Claims:
      - sub: subject (user id)
      - iat: issued at
      - exp: expiration
      - type: 'access'
    """
    now = _now_utc()
    exp = now + settings.JWT_ACCESS_TTL
    payload = {
        "sub": str(user.pk),
        "iat": _to_ts(now),
        "exp": _to_ts(exp),
        "type": "access",
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    # PyJWT returns str (>=2.x). Keep as-is.
    return token


def create_refresh_token(user: User) -> str:
    """
    Create a refresh token. Longer lived than access token.
    Claims are similar to access token, but 'type' == 'refresh'.
    """
    now = _now_utc()
    exp = now + settings.JWT_REFRESH_TTL
    payload = {
        "sub": str(user.pk),
        "iat": _to_ts(now),
        "exp": _to_ts(exp),
        "type": "refresh",
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token


def decode_token(token: str, expected_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Decode and validate a JWT. Enforces presence of 'sub' and optionally 'type'.
    Raises JWTError with small error codes/messages on failure.
    """

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "iat", "sub"]},  # sub is required
        )

        # Explicitly enforce sub is string (security!)
        if not isinstance(payload.get("sub"), str):
            raise JWTError("invalid_token", "Invalid subject (sub must be string)")

        if expected_type and payload.get("type") != expected_type:
            raise JWTError(
                "invalid_token",
                f"Invalid token type: expected {
                    expected_type}",
            )

        return payload

    except jwt.ExpiredSignatureError:
        raise JWTError("token_expired")
    except jwt.InvalidSignatureError:
        raise JWTError("invalid_token", "Invalid signature")
    except jwt.InvalidIssuerError:
        raise JWTError("invalid_token", "Invalid issuer")
    except jwt.InvalidAudienceError:
        raise JWTError("invalid_token", "Invalid audience")
    except jwt.ImmatureSignatureError:
        raise JWTError("token_not_valid")
    except jwt.InvalidTokenError as e:
        # This includes InvalidSubjectError, missing claims, etc.
        raise JWTError("invalid_token", "Invalid token") from e
    except Exception as e:
        raise JWTError("invalid_token", "Token decoding failed") from e


def get_user_from_payload(payload: Dict[str, Any]) -> User:
    """
    Resolve and return the User instance referenced by payload['sub'].
    Raises JWTError when user is missing or id invalid.
    """
    try:
        uid = int(payload["sub"])
    except Exception:
        raise JWTError("invalid_sub")

    try:
        user = User.objects.get(pk=uid)
    except User.DoesNotExist as ex:
        raise JWTError("user_not_found") from ex

    return user


# ---------------------------
# Ninja HttpBearer Auth class
# ---------------------------
class JWTAuth(HttpBearer):
    """
    Ninja HttpBearer implementation that accepts access tokens.

    Behavior:
      - If token is missing/invalid/expired -> returns None (Ninja responds 401).
      - On success: sets request.user and request.auth (both to User instance).
    """

    def authenticate(self, request: HttpRequest, token: str) -> Optional[object]:
        try:
            payload = decode_token(token, expected_type="access")
            user = get_user_from_payload(payload)
            request.user = user
            request.auth = user
            return user
        except JWTError:
            return None


# Singleton instance to import elsewhere
jwt_auth = JWTAuth()


# ---------------------------
# AuthService (business logic)
# ---------------------------
class AuthService:
    """
    Authentication business logic.

    Responsibilities:
    - Validate credentials (login)
    - Validate refresh tokens and issue new token pairs

    This class is intentionally independent of HTTP layer and returns primitives
    so it is easy to unit test.
    """

    @staticmethod
    def login(username: str, password: str) -> Dict[str, str]:
        """
        Authenticate using Django's authenticate().

        Returns:
            {"access": <str>, "refresh": <str>}

        Raises:
            HttpError(401) on invalid credentials.
        """
        user = authenticate(username=username, password=password)
        if not user:
            # HTTP 401 Unauthorized  # 401
            raise HttpError(int(HTTPStatus.UNAUTHORIZED), "Invalid credentials")

        access = create_access_token(user)
        refresh = create_refresh_token(user)
        return {"access": access, "refresh": refresh}

    @staticmethod
    def refresh_tokens(refresh_token: str) -> Dict[str, str]:
        """
        Validate refresh token and issue a fresh pair (access + refresh).

        Stateless implementation: can't revoke old refresh tokens here.
        On invalid/expired token -> HttpError(401).
        """
        try:
            payload = decode_token(refresh_token, expected_type="refresh")
            user = get_user_from_payload(payload)
        except JWTError:
            # HTTP 401 Unauthorized  # 401
            raise HttpError(
                int(HTTPStatus.UNAUTHORIZED), "Invalid or expired refresh token"
            )

        access = create_access_token(user)
        refresh = create_refresh_token(user)
        return {"access": access, "refresh": refresh}
