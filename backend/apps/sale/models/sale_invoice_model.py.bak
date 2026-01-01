from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from simple_history.models import HistoricalRecords

User = get_user_model()


class SaleInvoice(models.Model):
    """
    Financial snapshot of a CLOSED Sale.

    - Exactly one invoice per sale
    - Immutable after creation
    - Does NOT track payments directly
    - Stores final calculated numbers for reporting accuracy
    """

    class InvoiceStatus(models.TextChoices):
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

    invoice_number = models.CharField(
        _("Invoice number"),
        max_length=50,
        unique=True,
        db_index=True,
        help_text=_("Human-readable invoice identifier (e.g., INV-2025-001)"),
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
    status = models.CharField(
        _("Status"),
        max_length=20,
        choices=InvoiceStatus.choices,
        default=InvoiceStatus.UNPAID,
    )

    # ---- Metadata ----
    issued_at = models.DateTimeField(_("Issued at"), default=timezone.now)
    issued_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="issued_invoices",
        verbose_name=_("Issued by"),
    )

    # History tracking
    history = HistoricalRecords()

    class Meta:
        ordering = ("-issued_at",)
        verbose_name = _("Sale invoice")
        verbose_name_plural = _("Sale invoices")
        indexes = [
            models.Index(fields=["issued_at"]),
            models.Index(fields=["status"]),
            models.Index(fields=["invoice_number"]),
        ]

    def clean(self):
        """Validate invoice calculations"""
        if self.subtotal_amount < 0:
            raise ValidationError(_("Subtotal cannot be negative"))

        if self.discount_amount < 0:
            raise ValidationError(_("Discount cannot be negative"))

        if self.tax_amount < 0:
            raise ValidationError(_("Tax cannot be negative"))

        # Verify total calculation
        expected_total = self.subtotal_amount - self.discount_amount + self.tax_amount
        if abs(self.total_amount - expected_total) > Decimal("0.01"):
            raise ValidationError(
                _(
                    "Total amount (%(total)s) doesn't match calculation: "
                    "%(subtotal)s - %(discount)s + %(tax)s = %(expected)s"
                )
                % {
                    "total": self.total_amount,
                    "subtotal": self.subtotal_amount,
                    "discount": self.discount_amount,
                    "tax": self.tax_amount,
                    "expected": expected_total,
                }
            )

    @property
    def total_paid(self) -> Decimal:
        """Calculate total paid from completed payments"""
        from django.db.models import Sum

        return self.payments.filter(status="COMPLETED").aggregate(
            total=Sum("amount_applied")
        )["total"] or Decimal("0")

    @property
    def balance_due(self) -> Decimal:
        """Calculate remaining balance"""
        return self.total_amount - self.total_paid

    @property
    def is_fully_paid(self) -> bool:
        """Check if invoice is fully paid"""
        return self.balance_due <= Decimal("0.01")

    def __str__(self) -> str:
        return f"Invoice {self.invoice_number} | Sale #{self.sale_id}"
