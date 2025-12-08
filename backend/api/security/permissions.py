# api/security/permissions.py
"""
Permission dependencies for use in endpoints.

Each dependency receives the request (populated by authentication middleware)
and raises HttpError with appropriate status codes on failure.

Design:
- Keep dependencies small and single-responsibility.
- Use Django's built-in groups and flags (is_staff, is_superuser).
"""

from django.http import HttpRequest
from ninja.errors import HttpError


def require_authenticated(request: HttpRequest):
    """Raise 401 if not authenticated (Ninja normally handles this, but useful for explicit checks)."""
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        raise HttpError(401, "Authentication required")
    return user


def require_staff(request: HttpRequest):
    """Allow only staff (is_staff True)."""
    user = require_authenticated(request)
    if not user.is_staff:
        raise HttpError(403, "Staff permission required")
    return user


def require_superuser(request: HttpRequest):
    """Allow only superusers."""
    user = require_authenticated(request)
    if not user.is_superuser:
        raise HttpError(403, "Superuser permission required")
    return user


def require_group(*group_names: str):
    """
    Return a dependency that requires the user to belong to at least one of the provided groups.
    Usage:
        user = Depends(require_group('barista', 'supervisor'))
    """

    def dependency(request: HttpRequest):
        user = require_authenticated(request)
        if user.groups.filter(name__in=group_names).exists():
            return user
        raise HttpError(403, "Insufficient group membership")

    return dependency
