from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class SaleInvoice(models.Model):
    """
    Financial snapshot of a CLOSED Sale.

    - Exactly one invoice per sale
    - Immutable after creation
    - Does NOT track payments directly
    - Stores final calculated numbers for reporting accuracy
    """

    class Status(models.TextChoices):
        UNPAID = "UNPAID", _("Unpaid")
        PARTIALLY_PAID = "PARTIALLY_PAID", _("Partially paid")
        PAID = "PAID", _("Paid")
        VOID = "VOID", _("Void")

    sale = models.OneToOneField(
        "sale.Sale",
        on_delete=models.PROTECT,
        related_name="invoice",
        verbose_name=_("Sale"),
        help_text=_("Closed sale associated with this invoice"),
    )

    # ---- Financial Snapshot ----
    subtotal_amount = models.DecimalField(
        _("Subtotal amount"),
        max_digits=12,
        decimal_places=4,
        help_text=_("Final subtotal before discounts and tax"),
    )

    discount_amount = models.DecimalField(
        _("Discount amount"),
        max_digits=12,
        decimal_places=4,
        default=0,
        help_text=_("Total discount applied to this invoice"),
    )

    tax_amount = models.DecimalField(
        _("Tax amount"),
        max_digits=12,
        decimal_places=4,
        default=0,
    )

    total_amount = models.DecimalField(
        _("Total payable amount"),
        max_digits=12,
        decimal_places=4,
        help_text=_("Final amount customer must pay"),
    )

    # ---- Metadata ----
    issued_at = models.DateTimeField(_("Issued at"), default=timezone.now)
    issued_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="issued_invoices",
        verbose_name=_("Issued by"),
    )

    class Meta:
        ordering = ("-issued_at",)
        verbose_name = _("Sale invoice")
        verbose_name_plural = _("Sale invoices")
        indexes = [
            models.Index(fields=["issued_at"]),
        ]

    def __str__(self) -> str:
        return f"Invoice #{self.pk} | Sale #{self.sale_id}"
