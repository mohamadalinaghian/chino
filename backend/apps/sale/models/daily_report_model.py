from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _
from persiantools.jdatetime import JalaliDate
from simple_history.models import HistoricalRecords

User = get_user_model()


class DailyReport(models.Model):
    """
    End-of-day cash reconciliation and financial report.

    Tracks:
    - Expected vs Actual amounts by payment method
    - Revenue breakdown (sales, tips, refunds, discounts, tax)
    - Cost breakdown (COGS, labor, operating expenses)
    - Opening/closing float
    - Approval workflow

    ⚠️ MONETARY UNIT CONVENTION (VERY IMPORTANT)

    All monetary values in this system are stored in *logical Toman units*.

    - 1 stored unit = 1,000 IRR (i.e. 1 "system Toman")
    - Minimum representable amount = 1 system Toman = 1,000 IRR
    - Real-world values MUST be divided by 1,000 before storage
    - Display values MUST be multiplied by 1,000 for user-facing output

    Example:
    - Real price: 1,000,000 IRR (1 million toman in common speech)
    - Stored value: 1,000

    """

    class ReportStatus(models.TextChoices):
        DRAFT = "DRAFT", _("Draft")
        APPROVED = "APPROVED", _("Approved")

    # ---- Report Identification ----
    report_date = models.DateField(
        _("Report date"),
        unique=True,
        db_index=True,
        help_text=_("Business date for this report (cutoff at 2 AM next day)"),
    )

    status = models.CharField(
        _("Status"),
        max_length=20,
        choices=ReportStatus.choices,
        default=ReportStatus.DRAFT,
        db_index=True,
    )

    # ---- Opening/Closing Cash ----
    opening_float = models.PositiveIntegerField(
        _("Opening float"),
        default=0,
        help_text=_("Cash in drawer at start of business day"),
    )

    closing_cash_counted = models.PositiveIntegerField(
        _("Closing cash counted"),
        default=0,
        help_text=_("Actual cash counted at end of day"),
    )

    # ---- Revenue (Auto-calculated from system) ----
    expected_total_sales = models.PositiveIntegerField(
        _("Expected total sales"),
        help_text=_("Sum of all invoice totals for the day"),
    )

    expected_total_refunds = models.PositiveIntegerField(
        _("Expected total refunds"),
        default=0,
        help_text=_("Sum of all refunds issued"),
    )

    expected_total_discounts = models.DecimalField(
        _("Expected total discounts"),
        max_digits=12,
        decimal_places=4,
        help_text=_("Sum of all discounts applied"),
    )

    expected_total_tax = models.DecimalField(
        _("Expected total tax"),
        max_digits=12,
        decimal_places=4,
        help_text=_("Sum of all tax collected"),
    )

    # ---- Cost ----
    cost_of_goods_sold = models.DecimalField(
        _("Cost of goods sold"),
        max_digits=12,
        decimal_places=4,
        help_text=_("COGS from inventory system"),
    )

    total_expenses = models.DecimalField(
        _("Total expenses"),
        max_digits=12,
        decimal_places=4,
        help_text=_("Total expenses in report date"),
    )

    # ---- Notes ----

    notes = models.CharField(
        _("Notes"),
        max_length=512,
        blank=True,
        null=True,
        help_text=_("Additional notes or observations"),
    )

    # ---- User Tracking ----
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="daily_reports_created",
        verbose_name=_("Created by"),
        help_text=_("Accountant who created this report"),
    )

    approved_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="daily_reports_approved",
        verbose_name=_("Approved by"),
        null=True,
        blank=True,
        help_text=_("Manager who approved this report"),
    )

    # ---- Timestamps ----
    created_at = models.DateTimeField(
        _("Created at"),
        default=timezone.now,
        db_index=True,
    )

    approved_at = models.DateTimeField(
        _("Approved at"),
        null=True,
        blank=True,
    )

    # ---- History ----
    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Daily report")
        verbose_name_plural = _("Daily reports")
        ordering = ["-report_date"]
        indexes = [
            models.Index(fields=["-report_date", "status"]),
        ]

    def __str__(self):
        return self.jalali_report_date

    def clean(self):
        """Validate report data."""
        super().clean()

        if self.approved_at and self.approved_at < self.created_at:
            raise ValidationError(_("Approved date cannot be before created date"))

        # Validate status transitions
        if self.pk:  # Existing record
            old_instance = DailyReport.objects.get(pk=self.pk)
            if (
                old_instance.status != DailyReport.ReportStatus.DRAFT
                and old_instance.status != self.status
            ):
                raise ValidationError(_("Cannot edit report after submission."))

    # ---- Computed Properties ----
    @cached_property
    def jalali_report_date(self):
        return JalaliDate(self.report_date).strftime("%c", locale="fa")

    @property
    def total_revenue(self) -> Decimal:
        """Total revenue = sales - refunds + taxes - discounts."""
        return (
            self.expected_total_sales
            - self.expected_total_refunds
            + self.expected_total_tax
            - self.expected_total_discounts
        )

    @property
    def net_profit(self) -> Decimal:
        """Net profit = revenue - costs."""
        return self.total_revenue - self.cost_of_goods_sold

    @property
    def actual_income(self) -> Decimal:
        """All money income from sales - purchases."""
        return self.total_revenue - self.total_expenses

    @property
    def net_cash_received(self) -> Decimal:
        """Net cash = closing cash - opening float."""
        return self.closing_cash_counted - self.opening_float

    @property
    def expected_cash_total(self) -> Decimal:
        """
        Expected cash from payments.
        Calculated from payment_methods where method=CASH.
        """
        from .sale_payment_model import SalePayment

        return (
            self.payment_methods.select_related("daily_report")
            .get(payment_method=SalePayment.PaymentMethod.CASH)
            .expected_amount
        )

    @property
    def cash_variance(self) -> Decimal:
        """Cash variance = (closing - opening) - expected cash."""
        return self.net_cash_received - self.expected_cash_total

    @property
    def total_variance(self) -> Decimal:
        """Total variance across all payment methods."""
        return self.payment_methods.aggregate(total=models.Sum("variance"))[
            "total"
        ] or Decimal("0.0000")

    @property
    def is_editable(self) -> bool:
        """Check if report can be edited."""
        return self.status == DailyReport.ReportStatus.DRAFT
