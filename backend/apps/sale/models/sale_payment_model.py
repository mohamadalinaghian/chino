from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class SalePayment(models.Model):
    """
    Represents a payment applied to an invoice.

    Rules:
    - Append-only (never edited or deleted)
    - Tips live ONLY here
    - Refunds reference payments
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
        related_name="payments",
        verbose_name=_("Invoice"),
    )

    method = models.CharField(
        _("Payment method"),
        max_length=20,
        choices=Method.choices,
        db_index=True,
    )

    # ---- Financials ----
    amount_total = models.DecimalField(
        _("Total received"),
        max_digits=12,
        decimal_places=4,
        help_text=_("Total money received from customer"),
    )

    amount_applied = models.DecimalField(
        _("Applied to invoice"),
        max_digits=12,
        decimal_places=4,
        help_text=_("Amount applied to invoice balance"),
    )

    tip_amount = models.DecimalField(
        _("Tip amount"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0"),
        help_text=_("Optional tip (never refundable)"),
    )

    # ---- Method-specific ----
    destination_account = models.ForeignKey(
        "finance.BankAccount",
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
        choices=Status.choices,
        default=Status.COMPLETED,
        db_index=True,
    )

    class Meta:
        ordering = ("received_at",)
        verbose_name = _("Sale payment")
        verbose_name_plural = _("Sale payments")
        indexes = [
            models.Index(fields=["invoice"]),
            models.Index(fields=["method"]),
            models.Index(fields=["status"]),
        ]

    def clean(self):
        """
        Domain invariants:
        - amount_total = amount_applied + tip_amount
        - tip_amount >= 0
        - destination_account rules enforced
        """
        if self.amount_applied + self.tip_amount != self.amount_total:
            raise ValidationError(
                _("amount_total must equal amount_applied + tip_amount")
            )

        if self.tip_amount < 0:
            raise ValidationError(_("tip_amount cannot be negative"))

        if self.method == self.Method.CASH and self.destination_account:
            raise ValidationError(_("Cash payments must not have destination account"))

        if (
            self.method in {self.Method.POS, self.Method.CARD_TRANSFER}
            and not self.destination_account
        ):
            raise ValidationError(
                _("This payment method requires a destination account")
            )

    def __str__(self) -> str:
        return f"{self.get_method_display()} | {self.amount_total}"
