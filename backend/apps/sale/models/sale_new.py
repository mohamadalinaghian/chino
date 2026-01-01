"""
Unified Sale Model for POS System
Merges Sale and SaleInvoice concepts into a single lifecycle model.

A Sale goes through states:
1. OPEN - Can be modified, items can be added/removed
2. CLOSED - Invoice generated, immutable, payment tracking active
3. CANCELED - Voided, no longer valid

Financial Flow:
- OPEN: Items added, running total calculated
- CLOSED: Invoice number assigned, COGS calculated, payment tracking begins
- Payment can happen in CLOSED state only
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from simple_history.models import HistoricalRecords

User = get_user_model()


class Sale(models.Model):
    """
    Unified Sale model representing complete POS sale lifecycle.

    Combines metadata (table, guests, staff) with financial data (amounts, payments).
    State transitions are managed by services with proper permission checks.

    State Machine:
        OPEN -> CLOSED (via CloseSaleService)
        OPEN -> CANCELED (via CancelSaleService)
        CLOSED -> CANCELED (via CancelSaleService, may require refunds)
    """

    class SaleState(models.TextChoices):
        OPEN = "OPEN", _("Open")
        CLOSED = "CLOSED", _("Closed")
        CANCELED = "CANCELED", _("Canceled")

    class SaleType(models.TextChoices):
        DINE_IN = "DINE_IN", _("Dine in")
        TAKEAWAY = "TAKEAWAY", _("Takeaway")

    class PaymentStatus(models.TextChoices):
        """Payment status (only relevant when state=CLOSED)"""

        UNPAID = "UNPAID", _("Unpaid")
        PARTIALLY_PAID = "PARTIALLY_PAID", _("Partially paid")
        PAID = "PAID", _("Paid")

    # ==================== SALE METADATA ====================

    state = models.CharField(
        _("State"),
        max_length=16,
        choices=SaleState.choices,
        default=SaleState.OPEN,
        db_index=True,
        help_text=_("Current lifecycle state of the sale"),
    )

    sale_type = models.CharField(
        _("Sale type"),
        max_length=16,
        choices=SaleType.choices,
        help_text=_("Service method: dine-in or takeaway"),
    )

    # ---- Customer Context ----
    table = models.ForeignKey(
        "inventory.Table",
        models.PROTECT,
        verbose_name=_("Table"),
        related_name="sales",
        null=True,
        blank=True,
        help_text=_("Table for dine-in sales"),
    )

    guest_count = models.PositiveSmallIntegerField(
        _("Guest count"),
        null=True,
        blank=True,
        help_text=_("Number of guests at table"),
    )

    guest = models.ForeignKey(
        User,
        verbose_name=_("Registered guest"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="guest_sales",
        help_text=_("Link to registered customer account"),
    )

    # ---- Staff Tracking (Audit Trail) ----
    opened_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        verbose_name=_("Opened by"),
        related_name="sales_opened",
        help_text=_("Staff member who created this sale"),
    )

    modified_by = models.ForeignKey(
        User,
        verbose_name=_("Last modified by"),
        on_delete=models.PROTECT,
        related_name="sales_modified",
        null=True,
        blank=True,
        help_text=_("Staff member who last modified items (while OPEN)"),
    )

    closed_by = models.ForeignKey(
        User,
        verbose_name=_("Closed by"),
        on_delete=models.PROTECT,
        related_name="sales_closed",
        null=True,
        blank=True,
        help_text=_("Staff member who finalized and invoiced the sale"),
    )

    canceled_by = models.ForeignKey(
        User,
        verbose_name=_("Canceled by"),
        on_delete=models.PROTECT,
        related_name="sales_canceled",
        null=True,
        blank=True,
        help_text=_("Staff member who canceled the sale"),
    )

    # ==================== INVOICE DATA (Populated when CLOSED) ====================

    invoice_number = models.CharField(
        _("Invoice number"),
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text=_("Auto-generated when sale is closed (e.g., INV-2025-001)"),
    )

    # ---- Financial Breakdown ----
    subtotal_amount = models.DecimalField(
        _("Subtotal"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text=_("Sum of all items before discounts and tax"),
    )

    discount_amount = models.DecimalField(
        _("Discount"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text=_("Total discount applied"),
    )

    tax_amount = models.DecimalField(
        _("Tax"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text=_("Sales tax (if applicable)"),
    )

    total_amount = models.DecimalField(
        _("Total amount"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text=_("Final payable amount (subtotal - discount + tax)"),
    )

    # ==================== REVENUE TRACKING (COGS from Inventory) ====================

    total_cost = models.DecimalField(
        _("Total cost (COGS)"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text=_("Cost of goods sold (calculated from inventory)"),
    )

    gross_profit = models.DecimalField(
        _("Gross profit"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text=_("Revenue - COGS (total_amount - total_cost)"),
    )

    gross_margin_percent = models.DecimalField(
        _("Gross margin %"),
        max_digits=5,
        decimal_places=2,
        default=Decimal("0"),
        help_text=_("(gross_profit / total_amount) * 100"),
    )

    # ==================== PAYMENT TRACKING ====================

    payment_status = models.CharField(
        _("Payment status"),
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
        db_index=True,
        help_text=_("Payment completion status (only for CLOSED sales)"),
    )

    # ---- Notes & Reasons ----
    note = models.TextField(
        _("Note"),
        blank=True,
        default="",
        help_text=_("General notes about the sale"),
    )

    close_reason = models.TextField(
        _("Close reason"),
        blank=True,
        default="",
        help_text=_("Optional reason for closing (e.g., 'normal checkout')"),
    )

    cancel_reason = models.TextField(
        _("Cancel reason"),
        blank=True,
        default="",
        help_text=_("Required reason for cancellation"),
    )

    # ==================== TIMESTAMPS ====================

    opened_at = models.DateTimeField(
        _("Opened at"),
        default=timezone.now,
        db_index=True,
    )

    closed_at = models.DateTimeField(
        _("Closed at"),
        null=True,
        blank=True,
        db_index=True,
    )

    canceled_at = models.DateTimeField(
        _("Canceled at"),
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(_("Created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated at"), auto_now=True)

    # ---- Audit History ----
    history = HistoricalRecords()

    class Meta:
        ordering = ("-opened_at",)
        verbose_name = _("Sale")
        verbose_name_plural = _("Sales")
        indexes = [
            models.Index(fields=["state", "opened_at"]),
            models.Index(fields=["state", "payment_status"]),
            models.Index(fields=["table", "state"]),
            models.Index(fields=["invoice_number"]),
            models.Index(fields=["opened_by"]),
            models.Index(fields=["closed_at"]),
        ]
        permissions = [
            ("open_sale", "Can open a new sale"),
            ("modify_sale", "Can modify an open sale"),
            ("close_sale", "Can close a sale and generate invoice"),
            ("cancel_sale", "Can cancel a sale"),
            ("view_sale_list", "Can view sale list"),
            ("view_sale_detail", "Can view sale details"),
            ("view_revenue_data", "Can view cost and profit data"),
        ]

    # ==================== PROPERTIES (Calculated Fields) ====================

    @property
    def table_number(self) -> str | None:
        """Get table number for compatibility"""
        return self.table.number if self.table else None

    @property
    def total_paid(self) -> Decimal:
        """Calculate total paid from completed payments"""
        from django.db.models import Sum

        result = self.payments.filter(status="COMPLETED").aggregate(
            total=Sum("amount_applied")
        )
        return result["total"] or Decimal("0")

    @property
    def balance_due(self) -> Decimal:
        """Calculate remaining balance"""
        return self.total_amount - self.total_paid

    @property
    def is_fully_paid(self) -> bool:
        """Check if sale is fully paid"""
        return self.balance_due <= Decimal("0.01")

    @property
    def is_open(self) -> bool:
        """Check if sale can be modified"""
        return self.state == self.SaleState.OPEN

    @property
    def is_closed(self) -> bool:
        """Check if sale is closed/invoiced"""
        return self.state == self.SaleState.CLOSED

    @property
    def is_canceled(self) -> bool:
        """Check if sale is canceled"""
        return self.state == self.SaleState.CANCELED

    # ==================== VALIDATION ====================

    def clean(self):
        """Validate sale data integrity"""
        super().clean()

        # Validate state-specific requirements
        if self.state == self.SaleState.CLOSED:
            if not self.invoice_number:
                raise ValidationError(_("Closed sales must have an invoice number"))
            if not self.closed_by:
                raise ValidationError(_("Closed sales must have closed_by set"))
            if not self.closed_at:
                raise ValidationError(_("Closed sales must have closed_at set"))

        if self.state == self.SaleState.CANCELED:
            if not self.canceled_by:
                raise ValidationError(_("Canceled sales must have canceled_by set"))
            if not self.canceled_at:
                raise ValidationError(_("Canceled sales must have canceled_at set"))
            if not self.cancel_reason:
                raise ValidationError(
                    _("Canceled sales must have a cancellation reason")
                )

        # Validate financial calculations
        if self.subtotal_amount < 0:
            raise ValidationError(_("Subtotal cannot be negative"))

        if self.discount_amount < 0:
            raise ValidationError(_("Discount cannot be negative"))

        if self.tax_amount < 0:
            raise ValidationError(_("Tax cannot be negative"))

        # Verify total calculation (allow small rounding difference)
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

        # Validate table requirement for dine-in
        if self.sale_type == self.SaleType.DINE_IN and not self.table:
            raise ValidationError(_("Dine-in sales must have a table assigned"))

        # Validate COGS/profit consistency
        if self.total_cost < 0:
            raise ValidationError(_("Total cost cannot be negative"))

        expected_profit = self.total_amount - self.total_cost
        if abs(self.gross_profit - expected_profit) > Decimal("0.01"):
            raise ValidationError(
                _(
                    "Gross profit calculation mismatch: expected %(expected)s, got %(actual)s"
                )
                % {"expected": expected_profit, "actual": self.gross_profit}
            )

    def save(self, *args, **kwargs):
        """Auto-calculate fields before save"""
        # Calculate total amount
        self.total_amount = (
            self.subtotal_amount - self.discount_amount + self.tax_amount
        )

        # Calculate gross profit
        self.gross_profit = self.total_amount - self.total_cost

        # Calculate gross margin percentage
        if self.total_amount > 0:
            self.gross_margin_percent = (
                self.gross_profit / self.total_amount
            ) * Decimal("100")
        else:
            self.gross_margin_percent = Decimal("0")

        # Full validation
        self.full_clean()

        super().save(*args, **kwargs)

    def __str__(self) -> str:
        if self.invoice_number:
            return f"Sale #{
                    self.pk} ({self.invoice_number}) - {self.get_state_display()}"

        table_info = f" - {self.table.name}" if self.table else ""
        return f"Sale #{self.pk} ({self.get_state_display()}){table_info}"
