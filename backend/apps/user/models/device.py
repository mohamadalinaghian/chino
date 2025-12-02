"""
Device Authorization and Session Management

This module implements device-based security for cafe POS terminals.

Security Strategy:
    - Device Token: Unique token per authorized device
    - Browser Fingerprint: Additional validation layer
    - Session Management: 5-hour tokens, max 3 per day per user
    - No MAC address (browser cannot access it reliably)

FILE LOCATION: apps/user/models/device.py
"""

import secrets

from apps.utils.models import TimeStampedModel
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class AuthorizedDevice(TimeStampedModel):
    """
    Represents an authorized device for sale operations.

    Admin registers devices, system generates unique tokens.
    Staff must use authorized devices to access sale endpoints.

    Design Pattern: Whitelist Security
        - Only pre-approved devices can access system
        - Each device has unique, secret token
        - Admin has full control over device access
    """

    device_name = models.CharField(
        _("Device Name"),
        max_length=100,
        help_text=_("Friendly name (e.g., 'Counter 1 PC', 'Main Register')"),
    )

    device_token = models.CharField(
        _("Device Token"),
        max_length=128,
        unique=True,
        editable=False,
        help_text=_("Unique secret token for this device (auto-generated)"),
    )

    notes = models.TextField(
        _("Notes"), blank=True, help_text=_("Internal notes about this device")
    )

    # Tracking
    last_used_at = models.DateTimeField(_("Last Used"), null=True, blank=True)

    last_used_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="last_used_devices",
        verbose_name=_("Last Used By"),
    )

    # Browser fingerprint for extra security
    fingerprint = models.JSONField(
        _("Browser Fingerprint"),
        null=True,
        blank=True,
        help_text=_("Browser characteristics for validation"),
    )

    # Status
    is_active = models.BooleanField(
        _("Is Active"),
        default=True,
        help_text=_("Is this device currently authorized?"),
    )

    class Meta:
        verbose_name = _("Authorized Device")
        verbose_name_plural = _("Authorized Devices")
        ordering = ["-last_used_at", "device_name"]
        indexes = [
            models.Index(fields=["device_token", "is_active"]),
            models.Index(fields=["is_active", "last_used_at"]),
        ]

    def __str__(self):
        return f"{self.device_name}"

    def save(self, *args, **kwargs):
        """Generate device token on creation."""
        if not self.device_token:
            self.device_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def update_last_used(self, user):
        """Update tracking info when device is used."""
        now = timezone.now()
        if not self.last_used_at or (now - self.last_used_at).seconds > 300:
            self.last_used_at = now
            self.last_used_by = user
            self.save(update_fields=["last_used_at", "last_used_by"])

    def get_active_sessions_count(self):
        """Get number of currently active sessions on this device."""
        return self.sessions.filter(
            is_active=True, expires_at__gt=timezone.now()
        ).count()

    def deactivate(self):
        """Deactivate device and terminate all active sessions."""
        self.is_active = False
        self.save()

        # Terminate all active sessions
        self.sessions.filter(is_active=True).update(
            is_active=False, terminated_at=timezone.now()
        )
