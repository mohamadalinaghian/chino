from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from simple_history.models import HistoricalRecords

User = get_user_model()


class SalePayment(models.Model):
    """
    Represents a payment applied to an invoice.

    Rules:
    - Append-only (never edited or deleted)
    - Tips live ONLY here
    - Refunds reference payments
    """

    class PaymentMethod(models.TextChoices):
        CASH = "CASH", _("Cash")
        POS = "POS", _("POS")
        CARD_TRANSFER = "CARD_TRANSFER", _("Card to card")

    class PaymentStatus(models.TextChoices):
        COMPLETED = "COMPLETED", _("Completed")
        VOID = "VOID", _("Voided")

    sale = models.ForeignKey(
        "sale.Sale",
        on_delete=models.PROTECT,
        related_name="payments",
        verbose_name=_("Sale"),
    )

    method = models.CharField(
        _("Payment method"),
        max_length=20,
        choices=PaymentMethod.choices,
        db_index=True,
    )

    # ==================== FINANCIAL CORE ====================

    amount_applied = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text=_("Amount applied to sale subtotal"),
    )

    tax_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text=_("Tax applied in this payment"),
    )

    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text=_("Discount applied in this payment"),
    )

    tip_amount = models.DecimalField(
        _("Tip amount"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0"),
        help_text=_("Optional tip (never refundable)"),
    )

    # ==================== METADATA ====================
    confirmed = models.BooleanField(_("Is confirmed"), default=False)

    # ---- Method-specific ----
    destination_account = models.ForeignKey(
        "user.BankAccount",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="received_payments",
        verbose_name=_("Destination account"),
        help_text=_("Required for POS and card-to-card payments"),
    )

    received_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="received_payments",
        verbose_name=_("Received by"),
    )

    received_at = models.DateTimeField(_("Received at"), default=timezone.now)

    status = models.CharField(
        _("Status"),
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.COMPLETED,
        db_index=True,
    )

    # History tracking
    history = HistoricalRecords()

    class Meta:
        ordering = ("received_at",)
        verbose_name = _("Sale payment")
        verbose_name_plural = _("Sale payments")
        indexes = [
            models.Index(fields=["sale"]),
            models.Index(fields=["method"]),
            models.Index(fields=["status"]),
        ]

    # ==================== VALIDATION ====================

    def clean(self):
        super().clean()

        if self.amount_applied <= 0:
            raise ValidationError(_("Amount applied must be greater than zero"))

        if self.tax_amount < 0:
            raise ValidationError(_("Tax amount cannot be negative"))

        if self.discount_amount < 0:
            raise ValidationError(_("Discount amount cannot be negative"))

        if self.discount_amount > self.amount_applied:
            raise ValidationError(_("Discount cannot exceed applied amount"))

        if self.status == self.PaymentStatus.COMPLETED:
            if self.sale.state != self.sale.SaleState.OPEN:
                raise ValidationError(_("Cannot complete payment for non-open sale"))

    @property
    def total_refunded(self) -> Decimal:
        """Calculate total refunded amount"""
        from django.db.models import Sum

        return self.refunds.filter(status="COMPLETED").aggregate(total=Sum("amount"))[
            "total"
        ] or Decimal("0")

    @property
    def refundable_amount(self) -> Decimal:
        """Calculate remaining refundable amount (excludes tips)"""
        return self.amount_applied - self.total_refunded

    def __str__(self) -> str:
        return f"{self.get_method_display()} | {self.amount_applied}"
