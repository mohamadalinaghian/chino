from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

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

    class Meta:
        ordering = ("processed_at",)
        verbose_name = _("Sale refund")
        verbose_name_plural = _("Sale refunds")
        indexes = [
            models.Index(fields=["invoice"]),
            models.Index(fields=["payment"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"Refund {self.amount} for Payment #{self.payment_id}"
