from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _
from simple_history.models import HistoricalRecords


class CashDenomination(models.Model):
    """
    Cash bill/coin breakdown for daily report.

    Tracks physical count of each denomination to verify closing cash total.
    Example: 10 × $20 bills = $200
    """

    daily_report = models.ForeignKey(
        "sale.DailyReport",
        on_delete=models.CASCADE,
        related_name="cash_denominations",
        verbose_name=_("Daily report"),
    )

    denomination = models.DecimalField(
        _("Denomination"),
        max_digits=10,
        decimal_places=2,
        help_text=_("Bill/coin value (e.g., 0.01, 0.05, 0.25, 1, 5, 10, 20, 50, 100)"),
    )

    quantity = models.IntegerField(
        _("Quantity"),
        default=0,
        help_text=_("Number of bills/coins of this denomination"),
    )

    total_amount = models.DecimalField(
        _("Total amount"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Denomination × quantity"),
    )

    # ---- History ----
    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Cash denomination")
        verbose_name_plural = _("Cash denominations")
        unique_together = [["daily_report", "denomination"]]
        ordering = ["-denomination"]  # Largest bills first

    def __str__(self):
        return f"{self.quantity} × ${self.denomination} = ${self.total_amount}"

    def clean(self):
        """Validate denomination data."""
        super().clean()

        # Validate denomination is positive
        if self.denomination <= 0:
            raise ValidationError(_("Denomination must be positive"))

        # Validate quantity is non-negative
        if self.quantity < 0:
            raise ValidationError(_("Quantity cannot be negative"))

        # Auto-calculate total
        self.total_amount = Decimal(str(self.denomination)) * self.quantity

        # Validate report is editable
        if self.daily_report and not self.daily_report.is_editable:
            raise ValidationError(
                _("Cannot modify denominations for non-draft reports")
            )

    def save(self, *args, **kwargs):
        """Override save to auto-calculate total."""
        self.total_amount = Decimal(str(self.denomination)) * self.quantity
        super().save(*args, **kwargs)
