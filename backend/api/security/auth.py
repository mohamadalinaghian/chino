# api/security/auth.py
"""
JWT Authentication for Django Ninja API.
Provides stateless authentication using access/refresh token pairs.
"""

from datetime import datetime, timedelta
from typing import Optional

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from ninja.security import HttpBearer

User = get_user_model()


class JWTAuth(HttpBearer):
    """
    HTTP Bearer authentication handler for Django Ninja.
    Validates JWT tokens and attaches user to request.
    """

    def authenticate(self, request, token: str) -> Optional[User]:
        """
        Validates JWT token and returns authenticated user.

        Args:
            request: Django HttpRequest
            token: JWT access token from Authorization header

        Returns:
            User instance if token is valid, None otherwise
        """
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

            # Check token type
            if payload.get("type") != "access":
                return None

            # Check expiration
            if datetime.utcnow().timestamp() > payload.get("exp", 0):
                return None

            # Fetch user
            user = User.objects.get(id=payload.get("user_id"))

            # Check if user is active
            if not user.is_active:
                return None

            return user

        except (jwt.InvalidTokenError, User.DoesNotExist, KeyError):
            return None


# Singleton instance to use across endpoints
jwt_auth = JWTAuth()


class TokenService:
    """
    Service for generating and managing JWT tokens.
    """

    # Token expiration times
    ACCESS_TOKEN_LIFETIME = timedelta(minutes=30)
    REFRESH_TOKEN_LIFETIME = timedelta(days=7)

    @staticmethod
    def generate_access_token(user: User) -> str:
        """
        Creates a short-lived access token for API requests.

        Args:
            user: Django User instance

        Returns:
            JWT access token string
        """
        now = datetime.utcnow()
        payload = {
            "user_id": user.pk,
            "mobile": user.mobile,
            "type": "access",
            "iat": now,
            "exp": now + TokenService.ACCESS_TOKEN_LIFETIME,
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    @staticmethod
    def generate_refresh_token(user: User) -> str:
        """
        Creates a long-lived refresh token for obtaining new access tokens.

        Args:
            user: Django User instance

        Returns:
            JWT refresh token string
        """
        now = datetime.utcnow()
        payload = {
            "user_id": user.id,
            "type": "refresh",
            "iat": now,
            "exp": now + TokenService.REFRESH_TOKEN_LIFETIME,
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    @staticmethod
    def generate_token_pair(user: User) -> dict:
        """
        Generates both access and refresh tokens.

        Args:
            user: Django User instance

        Returns:
            Dictionary with 'access' and 'refresh' tokens
        """
        return {
            "access": TokenService.generate_access_token(user),
            "refresh": TokenService.generate_refresh_token(user),
        }

    @staticmethod
    def validate_refresh_token(token: str) -> Optional[User]:
        """
        Validates refresh token and returns associated user.

        Args:
            token: JWT refresh token string

        Returns:
            User instance if valid, None otherwise
        """
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

            # Check token type
            if payload.get("type") != "refresh":
                return None

            # Check expiration
            if datetime.utcnow().timestamp() > payload.get("exp", 0):
                return None

            # Fetch user
            user = User.objects.get(id=payload.get("user_id"))

            if not user.is_active:
                return None

            return user

        except (jwt.InvalidTokenError, User.DoesNotExist, KeyError):
            return None
