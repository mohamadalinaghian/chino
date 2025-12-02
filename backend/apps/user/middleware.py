"""
Device Session Middleware

Validates device session tokens for protected sale endpoints.

This middleware runs BEFORE views and checks:
    1. Session token exists in request header
    2. Session is valid (not expired)
    3. Device is active
    4. User is staff

"""

from apps.user.models import DeviceSession
from django.http import JsonResponse
from django.utils import timezone


class DeviceSessionMiddleware:
    """
    Validates device session for protected endpoints.

    Protected paths:
        - /sale/*     (all sale operations)
        - /kitchen/*  (kitchen operations, if exists)

    Skipped paths:
        - /admin/*    (Django admin)
        - /auth/*     (login endpoints)
        - Any other paths

    Usage:
        Add to settings.MIDDLEWARE after AuthenticationMiddleware:

        MIDDLEWARE = [
            ...
            ...
        ]
    """

    def __init__(self, get_response):
        self.get_response = get_response

        # Define protected path prefixes
        self.protected_prefixes = [
            "/sale/",
            "/kitchen/",
        ]

        # Define paths that should be skipped
        self.skip_prefixes = [
            "/admin/",
            "/auth/",
            "/api-auth/",  # DRF browsable API login
            "/static/",
            "/media/",
        ]

    def __call__(self, request):
        """
        Process each request.

        Flow:
            1. Check if path needs protection
            2. Extract session token from header
            3. Validate session
            4. Attach user/device to request
            5. Continue to view
        """

        # Skip if not a protected path
        if not self._is_protected_path(request.path):
            return self.get_response(request)

        # Skip if explicitly skipped path
        if self._is_skipped_path(request.path):
            return self.get_response(request)

        # Get session token from request header
        session_token = request.headers.get("Session-Token")

        if not session_token:
            return JsonResponse(
                {
                    "error": "Authentication required",
                    "detail": "Session-Token header is required for this endpoint",
                    "code": "SESSION_TOKEN_REQUIRED",
                },
                status=401,
            )

        # Validate session
        try:
            session = DeviceSession.objects.select_related("user", "device").get(
                session_token=session_token
            )

        except DeviceSession.DoesNotExist:
            return JsonResponse(
                {
                    "error": "Invalid session",
                    "detail": "Session token is invalid or does not exist",
                    "code": "INVALID_SESSION_TOKEN",
                },
                status=401,
            )

        # Check if session is valid
        if not session.is_valid():
            # Determine why session is invalid
            if not session.is_active:
                reason = "Session has been terminated"
                code = "SESSION_TERMINATED"
            elif timezone.now() > session.expires_at:
                reason = "Session has expired"
                code = "SESSION_EXPIRED"
            elif not session.device.is_active:
                reason = "Device has been deactivated"
                code = "DEVICE_DEACTIVATED"
            else:
                reason = "Session is no longer valid"
                code = "SESSION_INVALID"

            return JsonResponse(
                {
                    "error": "Session invalid",
                    "detail": reason,
                    "code": code,
                    "expired_at": (
                        session.expires_at.isoformat() if session.expires_at else None
                    ),
                },
                status=401,
            )

        # Check if user is staff
        if not session.user.is_staff:
            return JsonResponse(
                {
                    "error": "Access denied",
                    "detail": "Only staff members can access this endpoint",
                    "code": "NOT_STAFF_USER",
                },
                status=403,
            )

        # Update last activity
        # Note: This auto-updates via auto_now on last_activity field
        # No need to manually save

        # Attach user, device, and session to request
        request.user = session.user
        request.device = session.device
        request.session_obj = session

        # Continue to view
        response = self.get_response(request)

        return response

    def _is_protected_path(self, path):
        """Check if path needs session protection."""
        return any(path.startswith(prefix) for prefix in self.protected_prefixes)

    def _is_skipped_path(self, path):
        """Check if path should skip session validation."""
        return any(path.startswith(prefix) for prefix in self.skip_prefixes)


class DeviceSessionLoggingMiddleware:
    """
    Optional: Log all session activity for audit trail.

    Usage:
        Add to settings.MIDDLEWARE after DeviceSessionMiddleware if needed.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log session activity if session exists
        if hasattr(request, "session_obj") and request.session_obj:
            # You could log to database, file, or external service
            # For now, just track in session metadata
            session = request.session_obj

            # Update IP if changed (optional)
            client_ip = self._get_client_ip(request)
            if session.ip_address != client_ip:
                session.ip_address = client_ip
                session.save(update_fields=["ip_address"])

            # Update user agent if changed (optional)
            user_agent = request.META.get("HTTP_USER_AGENT", "")[:255]
            if session.user_agent != user_agent:
                session.user_agent = user_agent
                session.save(update_fields=["user_agent"])

        response = self.get_response(request)
        return response

    def _get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip
