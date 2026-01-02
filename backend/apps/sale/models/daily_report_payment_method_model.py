from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _
from simple_history.models import HistoricalRecords

from .sale_payment_model import SalePayment


class DailyReportPaymentMethod(models.Model):
    """
    Payment method reconciliation for a daily report.

    Tracks expected vs actual amounts for each payment method:
    - CASH: Physical cash counted
    - POS: Card payments from POS device report
    - BANK_TRANSFER: Direct bank transfers confirmed manually
    """

    daily_report = models.ForeignKey(
        "sale.DailyReport",
        on_delete=models.CASCADE,
        related_name="payment_methods",
        verbose_name=_("Daily report"),
    )

    payment_method = models.CharField(
        _("Payment method"),
        max_length=20,
        choices=SalePayment.PaymentMethod.choices,
        db_index=True,
    )

    # ---- Expected vs Actual ----
    expected_amount = models.DecimalField(
        _("Expected amount"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Amount calculated from system records"),
    )

    actual_amount = models.DecimalField(
        _("Actual amount"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_(
            "Amount entered by accountant (cash counted, POS report, bank confirmed)"
        ),
    )

    variance = models.DecimalField(
        _("Variance"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Difference between actual and expected (actual - expected)"),
    )

    notes = models.TextField(
        _("Notes"),
        blank=True,
        help_text=_("Additional notes for this payment method"),
    )

    # ---- History ----
    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Daily report payment method")
        verbose_name_plural = _("Daily report payment methods")
        unique_together = [["daily_report", "payment_method"]]
        ordering = ["payment_method"]

    def __str__(self):
        return f"{self.payment_method} - {self.daily_report.report_date}"

    def clean(self):
        """Validate payment method data."""
        super().clean()

        # Auto-calculate variance
        self.variance = self.actual_amount - self.expected_amount

        # Validate report is editable
        if self.daily_report and not self.daily_report.is_editable:
            raise ValidationError(
                _("Cannot modify payment methods for non-draft reports")
            )

    def save(self, *args, **kwargs):
        """Override save to auto-calculate variance."""
        self.variance = self.actual_amount - self.expected_amount
        super().save(*args, **kwargs)

    @property
    def is_balanced(self) -> bool:
        """Check if expected equals actual (within tolerance)."""
        return abs(self.variance) < Decimal("0.01")

    @property
    def variance_percentage(self) -> Decimal:
        """Calculate variance as percentage of expected."""
        if self.expected_amount == 0:
            return Decimal("0.0000")
        return (self.variance / self.expected_amount) * 100
