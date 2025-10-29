from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _


class DailyFinancialReport(models.Model):
    """
    Daily snapshot of cafe financial status, verifying POS, cash, card-to-card, and expenses.
    """

    report_date = models.DateField(
        _("Report date"),
        unique=True,
        db_index=True,
        help_text=_("Date of the report"),
    )
    total_revenue = models.DecimalField(
        _("Total revenue"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Sum of SaleInvoice revenue"),
    )
    pos_device_total = models.DecimalField(
        _("POS device total"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Total from POS device reports"),
    )
    physical_cash_total = models.DecimalField(
        _("Physical cash total"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Physical cash counted"),
    )
    card_to_card_total = models.DecimalField(
        _("Card-to-card total"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Total from transfer images"),
    )
    purchase_expenses = models.DecimalField(
        _("Purchase expenses"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Sum of PurchaseInvoice costs"),
    )
    misc_expenses = models.DecimalField(
        _("Miscellaneous expenses"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Non-purchase expenses (e.g., bills, taxes, repairs)"),
    )
    total_cogs = models.DecimalField(
        _("Total COGS"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Cost of goods sold"),
    )
    total_profit = models.DecimalField(
        _("Total profit"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Revenue minus COGS and expenses"),
    )
    payment_discrepancy = models.DecimalField(
        _("Payment discrepancy"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Revenue minus sum of POS, cash, card-to-card totals"),
        db_index=True,
    )
    pos_discrepancy = models.DecimalField(
        _("POS discrepancy"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("POS device total minus PosTransaction sum"),
        db_index=True,
    )
    cash_discrepancy = models.DecimalField(
        _("Cash discrepancy"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Physical cash minus CashTransaction sum"),
        db_index=True,
    )
    card_to_card_discrepancy = models.DecimalField(
        _("Card-to-card discrepancy"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Card-to-card total minus CardToCard sum"),
        db_index=True,
    )
    notes = models.TextField(
        _("Notes"),
        blank=True,
        null=True,
        help_text=_("Anomalies or comments"),
    )
    created_at = models.DateTimeField(_("Created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated at"), auto_now=True)

    from apps.sale.managers import ReportManager

    objects = ReportManager()

    def clean(self):
        """Validate non-negative fields and profit."""
        for field in [
            "total_revenue",
            "pos_device_total",
            "physical_cash_total",
            "card_to_card_total",
            "purchase_expenses",
            "misc_expenses",
            "total_cogs",
        ]:
            if getattr(self, field) < 0:
                raise ValidationError({field: _("Value cannot be negative")})
        expected_profit = (
            self.total_revenue
            - self.total_cogs
            - (self.purchase_expenses + self.misc_expenses)
        )
        if self.total_profit != expected_profit:
            raise ValidationError(
                {"total_profit": _("Profit must equal revenue minus COGS and expenses")}
            )
        super().clean()

    def __str__(self):
        return f"Financial Report for {self.report_date}"

    class Meta:
        verbose_name = _("Daily financial report")
        verbose_name_plural = _("Daily financial reports")
        ordering = ("-report_date",)
        indexes = [models.Index(fields=("report_date",))]
