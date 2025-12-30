from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from simple_history.models import HistoricalRecords

from .daily_report_payment_method_model import DailyReportPaymentMethod

User = get_user_model()


class DailyReport(models.Model):
    """
    End-of-day cash reconciliation and financial report.

    Tracks:
    - Expected vs Actual amounts by payment method
    - Revenue breakdown (sales, tips, refunds, discounts, tax)
    - Cost breakdown (COGS, labor, operating expenses)
    - Cash denominations
    - Opening/closing float
    - Approval workflow
    """

    class ReportStatus(models.TextChoices):
        DRAFT = "DRAFT", _("Draft")
        SUBMITTED = "SUBMITTED", _("Submitted")
        APPROVED = "APPROVED", _("Approved")
        DISPUTED = "DISPUTED", _("Disputed")
        CLOSED = "CLOSED", _("Closed")

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
    opening_float = models.DecimalField(
        _("Opening float"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Cash in drawer at start of business day"),
    )

    closing_cash_counted = models.DecimalField(
        _("Closing cash counted"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Actual cash counted at end of day"),
    )

    # ---- Revenue (Auto-calculated from system) ----
    expected_total_sales = models.DecimalField(
        _("Expected total sales"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Sum of all invoice totals for the day"),
    )

    expected_total_tips = models.DecimalField(
        _("Expected total tips"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Sum of all tips from payments"),
    )

    expected_total_refunds = models.DecimalField(
        _("Expected total refunds"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Sum of all refunds issued"),
    )

    expected_total_discounts = models.DecimalField(
        _("Expected total discounts"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Sum of all discounts applied"),
    )

    expected_total_tax = models.DecimalField(
        _("Expected total tax"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Sum of all tax collected"),
    )

    # ---- Costs (Manual entry) ----
    cost_of_goods_sold = models.DecimalField(
        _("Cost of goods sold"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("COGS from inventory system"),
    )

    labor_costs = models.DecimalField(
        _("Labor costs"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Employee wages for the day"),
    )

    operating_expenses = models.DecimalField(
        _("Operating expenses"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000"),
        help_text=_("Other operating expenses (utilities, rent, etc.)"),
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

    submitted_at = models.DateTimeField(
        _("Submitted at"),
        null=True,
        blank=True,
    )

    approved_at = models.DateTimeField(
        _("Approved at"),
        null=True,
        blank=True,
    )

    closed_at = models.DateTimeField(
        _("Closed at"),
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
        return f"Daily Report {self.report_date} ({self.get_status_display()})"

    def clean(self):
        """Validate report data."""
        super().clean()

        # Validate dates
        if self.submitted_at and self.submitted_at < self.created_at:
            raise ValidationError(_("Submitted date cannot be before created date"))

        if (
            self.approved_at
            and self.submitted_at
            and self.approved_at < self.submitted_at
        ):
            raise ValidationError(_("Approved date cannot be before submitted date"))

        if self.closed_at and self.approved_at and self.closed_at < self.approved_at:
            raise ValidationError(_("Closed date cannot be before approved date"))

        # Validate status transitions
        if self.pk:  # Existing record
            old_instance = DailyReport.objects.get(pk=self.pk)
            if (
                old_instance.status != DailyReport.ReportStatus.DRAFT
                and old_instance.status != self.status
            ):
                raise ValidationError(
                    _("Cannot edit report after submission. Current status: %(status)s")
                    % {"status": old_instance.get_status_display()}
                )

    # ---- Computed Properties ----

    @property
    def total_revenue(self) -> Decimal:
        """Total revenue = sales - refunds + tips."""
        return (
            self.expected_total_sales
            - self.expected_total_refunds
            + self.expected_total_tips
        )

    @property
    def total_costs(self) -> Decimal:
        """Total costs = COGS + labor + operating expenses."""
        return self.cost_of_goods_sold + self.labor_costs + self.operating_expenses

    @property
    def net_profit(self) -> Decimal:
        """Net profit = revenue - costs."""
        return self.total_revenue - self.total_costs

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

        cash_methods = self.payment_methods.filter(
            payment_method=DailyReportPaymentMethod.PaymentMethodType.CASH
        )
        return cash_methods.aggregate(total=models.Sum("expected_amount"))[
            "total"
        ] or Decimal("0.0000")

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

    @property
    def is_submitted(self) -> bool:
        """Check if report is submitted."""
        return self.status in [
            DailyReport.ReportStatus.SUBMITTED,
            DailyReport.ReportStatus.APPROVED,
            DailyReport.ReportStatus.CLOSED,
        ]

    @property
    def is_finalized(self) -> bool:
        """Check if report is finalized (closed)."""
        return self.status == DailyReport.ReportStatus.CLOSED
