from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class SalePayment(models.Model):
    """
    Represents a payment made against a SaleInvoice.

    Payments are append-only.
    Invoice becomes immutable after first payment.
    Tips are stored ONLY here.
    """

    class PaymentMethod(models.TextChoices):
        CASH = "CASH", _("Cash")
        POS = "POS", _("POS")
        CARD_TRANSFER = "CARD_TRANSFER", _("Card to card")

    class PaymentStatus(models.TextChoices):
        COMPLETED = "COMPLETED", _("Completed")
        VOID = "VOID", _("Voided")
        REFUNDED = "REFUNDED", _("Refunded")

    invoice = models.ForeignKey(
        "sale.SaleInvoice",
        on_delete=models.PROTECT,
        related_name="payments",
        verbose_name=_("Invoice"),
    )

    method = models.CharField(
        _("Payment method"),
        max_length=20,
        choices=PaymentMethod.choices,
        db_index=True,
    )

    # Financials
    amount_total = models.DecimalField(
        _("Total received amount"),
        max_digits=12,
        decimal_places=4,
        help_text=_("Total amount received from customer"),
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
        help_text=_("Optional tip amount"),
    )

    # Method-specific (minimal)
    destination_account = models.ForeignKey(
        "user.BankAccount",
        models.PROTECT,
        related_name="entries",
        verbose_name=_("Destination card number"),
        null=True,
        blank=True,
        help_text=_("Required only for card-to-card payments"),
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

    class Meta:
        verbose_name = _("Sale payment")
        verbose_name_plural = _("Sale payments")
        ordering = ("received_at",)
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
        """
        if self.amount_applied + self.tip_amount != self.amount_total:
            raise ValueError("amount_total must equal amount_applied + tip_amount")

        if self.tip_amount < 0:
            raise ValueError("tip_amount cannot be negative")
        if (
            self.method == self.PaymentMethod.CARD_TRANSFER
            and not self.destination_account
        ):
            raise ValueError(
                "destination_account is required for card transfer payments"
            )

        if self.method != self.PaymentMethod.CARD_TRANSFER and self.destination_account:
            raise ValueError(
                "destination_account must be empty unless payment method is card transfer"
            )

    def __str__(self) -> str:
        return f"{self.get_method_display()} - {self.amount_total}"
