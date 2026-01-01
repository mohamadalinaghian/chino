from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from simple_history.models import HistoricalRecords

from .sale_payment_model import SalePayment

User = get_user_model()


class SaleRefund(models.Model):
    """
    Represents a refund against a specific payment.

    Rules:
    - Refunds reference payments (not invoices directly)
    - Tips are NEVER refundable
    - Refund method may differ from payment method
    """

    class Status(models.TextChoices):
        COMPLETED = "COMPLETED", _("Completed")
        VOID = "VOID", _("Voided")

    payment = models.ForeignKey(
        "sale.SalePayment",
        on_delete=models.PROTECT,
        related_name="refunds",
        verbose_name=_("Original payment"),
    )

    amount = models.PositiveIntegerField(
        _("Refund amount"),
        help_text=_("Refunded amount (excluding tip)"),
    )

    method = models.CharField(
        _("Refund method"), max_length=20, choices=SalePayment.PaymentMethod.choices
    )

    processed_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="processed_refunds",
        verbose_name=_("Processed by"),
    )

    processed_at = models.DateTimeField(_("Processed at"), default=timezone.now)

    reason = models.CharField(
        _("Reason"),
        max_length=255,
        blank=True,
    )

    status = models.CharField(
        _("Status"),
        max_length=20,
        choices=Status.choices,
        default=Status.COMPLETED,
        db_index=True,
    )

    # History tracking
    history = HistoricalRecords()

    class Meta:
        ordering = ("processed_at",)
        verbose_name = _("Sale refund")
        verbose_name_plural = _("Sale refunds")
        indexes = [
            models.Index(fields=["payment"]),
            models.Index(fields=["status"]),
        ]

    def clean(self):
        """Validate refund rules"""
        if self.amount <= 0:
            raise ValidationError(_("Refund amount must be positive"))

        # Verify refund doesn't exceed payment
        if hasattr(self, "payment") and self.payment:
            total_refunded = self.payment.refunds.filter(
                status=self.Status.COMPLETED
            ).exclude(pk=self.pk).aggregate(total=models.Sum("amount"))[
                "total"
            ] or Decimal(
                "0"
            )

            if total_refunded + self.amount > self.payment.amount_applied:
                raise ValidationError(
                    _(
                        "Total refunds (%(existing)s + %(new)s) exceed payment amount (%(payment)s)"
                    )
                    % {
                        "existing": total_refunded,
                        "new": self.amount,
                        "payment": self.payment.amount_applied,
                    }
                )

    def __str__(self) -> str:
        return f"Refund {self.amount} for Payment #{self.payment_id}"
