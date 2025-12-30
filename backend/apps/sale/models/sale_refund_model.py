from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from simple_history.models import HistoricalRecords

User = get_user_model()


class SaleRefund(models.Model):
    """
    Represents a refund against a specific payment.

    Rules:
    - Refunds reference payments (not invoices directly)
    - Tips are NEVER refundable
    - Refund method may differ from payment method
    """

    class Method(models.TextChoices):
        CASH = "CASH", _("Cash")
        POS = "POS", _("POS")
        CARD_TRANSFER = "CARD_TRANSFER", _("Card to card")

    class Status(models.TextChoices):
        COMPLETED = "COMPLETED", _("Completed")
        VOID = "VOID", _("Voided")

    invoice = models.ForeignKey(
        "sale.SaleInvoice",
        on_delete=models.PROTECT,
        related_name="refunds",
        verbose_name=_("Invoice"),
    )

    payment = models.ForeignKey(
        "sale.SalePayment",
        on_delete=models.PROTECT,
        related_name="refunds",
        verbose_name=_("Original payment"),
    )

    amount = models.DecimalField(
        _("Refund amount"),
        max_digits=12,
        decimal_places=4,
        help_text=_("Refunded amount (excluding tip)"),
    )

    method = models.CharField(
        _("Refund method"),
        max_length=20,
        choices=Method.choices,
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
            models.Index(fields=["invoice"]),
            models.Index(fields=["payment"]),
            models.Index(fields=["status"]),
        ]

    def clean(self):
        """Validate refund rules"""
        if self.amount <= 0:
            raise ValidationError(_("Refund amount must be positive"))

        # Verify refund doesn't exceed payment
        if hasattr(self, "payment") and self.payment:
            total_refunded = (
                self.payment.refunds.filter(status=self.Status.COMPLETED)
                .exclude(pk=self.pk)
                .aggregate(total=models.Sum("amount"))["total"]
                or Decimal("0")
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

        # Verify invoice matches payment's invoice
        if (
            hasattr(self, "payment")
            and hasattr(self, "invoice")
            and self.payment
            and self.invoice
        ):
            if self.payment.invoice_id != self.invoice_id:
                raise ValidationError(_("Refund invoice must match payment invoice"))

    def __str__(self) -> str:
        return f"Refund {self.amount} for Payment #{self.payment_id}"
