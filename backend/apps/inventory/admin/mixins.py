from django.contrib import messages
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class ValidationErrorMessageMixin:
    """
    Safely catch ValidationError in admin save methods and
    show user-friendly messages.
    Compatible with Django's ModelAdmin method signatures.
    """

    def _handle_validation_error(self, request, exc: ValidationError):
        """Centralized error message handler."""
        if hasattr(exc, "message_dict"):
            for field, errors in exc.message_dict.items():
                for error in errors:
                    self.message_user(
                        request,
                        f"{field}: {
                                      error}",
                        messages.ERROR,
                    )
        elif hasattr(exc, "message"):
            self.message_user(request, str(exc.message), messages.ERROR)
        else:
            self.message_user(request, _("An error occurred."), messages.ERROR)

    # ------------------------------------------------------------------ #
    # Correct signatures: MUST match Django's ModelAdmin exactly
    # ------------------------------------------------------------------ #
    def save_model(self, request, obj, form, change):
        try:
            super().save_model(request, obj, form, change)
        except ValidationError as exc:
            self._handle_validation_error(request, exc)
            raise  # Prevent saving

    def save_related(self, request, form, formsets, change):
        try:
            super().save_related(request, form, formsets, change)
        except ValidationError as exc:
            self._handle_validation_error(request, exc)
            raise  # Prevent related save
