from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _
from persiantools.jdatetime import JalaliDate


class Transaction(models.Model):
    """
    Base model for all payment transactions.
    No business logic - just data storage.
    """

    class PaymentType(models.TextChoices):
        POS = "POS", _("POS Terminal")
        CASH = "CASH", _("Cash")
        CARD_TO_CARD = "CARD_TO_CARD", _("Card to Card Transfer")

    # Core fields
    invoice = models.ForeignKey(
        "sale.SaleInvoice",
        on_delete=models.PROTECT,
        related_name="transactions",
        verbose_name=_("Invoice"),
    )
    amount = models.DecimalField(
        _("Amount"),
        max_digits=10,
        decimal_places=4,
    )
    payment_type = models.CharField(
        _("Payment type"),
        max_length=16,
        choices=PaymentType.choices,
    )
    payment_date = models.DateTimeField(
        _("Payment date"),
        default=timezone.now,
        db_index=True,
    )

    # Status tracking
    verified_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_transactions",
        verbose_name=_("Verified by"),
    )
    is_verified = models.BooleanField(
        _("Is verified"),
        default=True,
        db_index=True,
        help_text=_("Whether this transaction has been verified by accounting"),
    )
    verification_date = models.DateTimeField(
        _("Verification date"),
        null=True,
        blank=True,
    )

    @cached_property
    def jalali_payment_date(self) -> str:
        return JalaliDate(self.payment_date.date()).strftime("%c", locale="fa")

    # Metadata
    note = models.CharField(_("Note"), max_length=512, blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Transaction")
        verbose_name_plural = _("Transactions")
        ordering = ("-payment_date",)
        indexes = [
            models.Index(fields=["invoice", "payment_date"]),
            models.Index(fields=["payment_type", "payment_date"]),
            models.Index(fields=["is_verified", "payment_date"]),
        ]

    def __str__(self) -> str:
        return f"{self.payment_type} - {self.amount} - {self.jalali_payment_date}"
