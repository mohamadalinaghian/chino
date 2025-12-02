from apps.user.models import DeviceSession
from django.http import JsonResponse


class DeviceSessionMiddleware:
    """
    Validates device session for protected endpoints.

    Applies to: /sale/* endpoints (sale operations)
    Skips: /admin/, /auth/, public endpoints
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.protected_prefixes = [
            "/sale/",  # Sale operations
        ]

    def __call__(self, request):
        # Check if this is a protected endpoint
        if not any(
            request.path.startswith(prefix) for prefix in self.protected_prefixes
        ):
            return self.get_response(request)

        # Get session token from header
        session_token = request.headers.get("Session-Token")

        if not session_token:
            return JsonResponse(
                {
                    "error": "Session token required",
                    "detail": "Please login to access this endpoint",
                },
                status=401,
            )

        # Validate session
        try:
            session = DeviceSession.objects.select_related("user", "device").get(
                session_token=session_token
            )
        except DeviceSession.DoesNotExist:
            return JsonResponse({"error": "Invalid session token"}, status=401)

        # Check if session is valid (not expired, device active, etc.)
        if not session.is_valid():
            return JsonResponse(
                {
                    "error": "Session expired",
                    "detail": "Please login again",
                    "expired_at": session.expires_at.isoformat(),
                },
                status=401,
            )

        # Attach user and device to request
        request.user = session.user
        request.device = session.device
        request.session_obj = session

        # Continue to view
        return self.get_response(request)
