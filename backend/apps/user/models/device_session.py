import secrets
from datetime import timedelta

from apps.utils.models import TimeStampedModel
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class DeviceSession(TimeStampedModel):
    """
    Tracks user login sessions on authorized devices.

    Business Rules:
        - Each token valid for 5 hours
        - User can have max 3 tokens per day
        - Tokens expire automatically
        - Admin can force-terminate sessions

    Design Pattern: Session Management
        - Stateful authentication
        - Per-device session tracking
        - Automatic expiration
        - Rate limiting (3 per day)
    """

    device = models.ForeignKey(
        "user.AuthorizedDevice",
        on_delete=models.CASCADE,
        related_name="sessions",
        verbose_name=_("Device"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="device_sessions",
        verbose_name=_("User"),
    )

    # Session token (different from device token!)
    session_token = models.CharField(
        _("Session Token"),
        max_length=64,
        unique=True,
        editable=False,
        help_text=_("Unique token for this login session"),
    )

    # Expiration
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)

    expires_at = models.DateTimeField(
        _("Expires At"), help_text=_("Session expires after 5 hours")
    )

    # Session state
    is_active = models.BooleanField(_("Is Active"), default=True)

    terminated_at = models.DateTimeField(
        _("Terminated At"),
        null=True,
        blank=True,
        help_text=_("When session was manually terminated"),
    )

    # Activity tracking
    last_activity = models.DateTimeField(
        _("Last Activity"), auto_now=True, help_text=_("Last request time")
    )

    # Metadata
    user_agent = models.CharField(_("User Agent"), max_length=255, blank=True)

    ip_address = models.GenericIPAddressField(_("IP Address"), null=True, blank=True)

    class Meta:
        verbose_name = _("Device Session")
        verbose_name_plural = _("Device Sessions")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["session_token", "is_active"]),
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["device", "is_active"]),
            models.Index(fields=["expires_at", "is_active"]),
        ]

    def __str__(self):
        return f"{self.user.name} on {self.device.device_name} ({self.get_status_display()})"

    def get_status_display(self):
        """Get human-readable session status."""
        if not self.is_active:
            return "Terminated"
        if timezone.now() > self.expires_at:
            return "Expired"
        return "Active"

    def save(self, *args, **kwargs):
        """Generate token and set expiration on creation."""
        if not self.session_token:
            self.session_token = secrets.token_urlsafe(32)

        if not self.expires_at:
            # Token lifetime: 5 hours
            self.expires_at = timezone.now() + timedelta(hours=5)

        super().save(*args, **kwargs)

    def is_valid(self):
        """
        Check if session is currently valid.

        Returns:
            bool: True if session can be used
        """
        if not self.is_active:
            return False

        if timezone.now() > self.expires_at:
            return False

        if not self.device.is_active:
            return False

        return True

    def terminate(self):
        """Manually terminate this session."""
        self.is_active = False
        self.terminated_at = timezone.now()
        self.save(update_fields=["is_active", "terminated_at"])

    def get_remaining_time(self):
        """
        Get remaining time for this session.

        Returns:
            timedelta: Time until expiration (or None if expired)
        """
        if not self.is_valid():
            return None

        remaining = self.expires_at - timezone.now()
        return remaining if remaining.total_seconds() > 0 else None

    def get_remaining_hours(self):
        """Get remaining hours as float."""
        remaining = self.get_remaining_time()
        if remaining:
            return remaining.total_seconds() / 3600
        return 0

    @classmethod
    def can_create_new_session(cls, user):
        """
        Check if user can create new session.

        Business Rule: Max 3 sessions per day per user.

        Args:
            user: Account instance

        Returns:
            bool: True if user can create new session
        """
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        sessions_today = cls.objects.filter(
            user=user, created_at__gte=today_start, created_at__lt=today_end
        ).count()

        return sessions_today < 3

    @classmethod
    def get_remaining_sessions_today(cls, user):
        """
        Get how many more sessions user can create today.

        Args:
            user: Account instance

        Returns:
            int: Number of remaining sessions (0-3)
        """
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        sessions_today = cls.objects.filter(
            user=user, created_at__gte=today_start, created_at__lt=today_end
        ).count()

        return max(0, 3 - sessions_today)

    @classmethod
    def get_user_sessions_today(cls, user):
        """Get all sessions created by user today."""
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        return cls.objects.filter(
            user=user, created_at__gte=today_start, created_at__lt=today_end
        ).select_related("device")

    @classmethod
    def cleanup_expired_sessions(cls):
        """
        Cleanup expired sessions (run as scheduled task).

        Mark expired sessions as inactive.

        Returns:
            int: Number of sessions cleaned up
        """
        expired = cls.objects.filter(is_active=True, expires_at__lt=timezone.now())

        count = expired.count()
        expired.update(is_active=False)

        return count
