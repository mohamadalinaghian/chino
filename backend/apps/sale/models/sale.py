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

    Core principles (Option A):
    - Subtotal is the ONLY authoritative amount for payment completion.
    - Tax and discount are per-payment decisions and are DERIVED, not stored.
    - Final totals exist only as derived values (post-close snapshot semantics).
    """

    class SaleState(models.TextChoices):
        OPEN = "OPEN", _("Open")
        CLOSED = "CLOSED", _("Closed")
        CANCELED = "CANCELED", _("Canceled")

    class SaleType(models.TextChoices):
        DINE_IN = "DINE_IN", _("Dine in")
        TAKEAWAY = "TAKEAWAY", _("Takeaway")

    class PaymentStatus(models.TextChoices):
        UNPAID = "UNPAID", _("Unpaid")
        PARTIALLY_PAID = "PARTIALLY_PAID", _("Partially paid")
        PAID = "PAID", _("Paid")

    # ==================== SALE METADATA ====================

    state = models.CharField(
        max_length=16,
        choices=SaleState.choices,
        default=SaleState.OPEN,
        db_index=True,
    )

    sale_type = models.CharField(
        max_length=16,
        choices=SaleType.choices,
    )

    table = models.ForeignKey(
        "inventory.Table",
        models.PROTECT,
        related_name="sales",
        null=True,
        blank=True,
    )

    guest_count = models.PositiveSmallIntegerField(null=True, blank=True)

    guest = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="guest_sales",
    )

    opened_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="sales_opened",
    )

    modified_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="sales_modified",
        null=True,
        blank=True,
    )

    closed_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="sales_closed",
        null=True,
        blank=True,
    )

    canceled_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="sales_canceled",
        null=True,
        blank=True,
    )

    # ==================== FINANCIAL CORE ====================

    subtotal_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text=_("Authoritative subtotal (items only)"),
    )

    # ---- Revenue / Accounting (post-close meaningful) ----

    total_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text=_("COGS, calculated at close"),
    )

    gross_profit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
    )

    gross_margin_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0"),
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
        db_index=True,
    )

    # ==================== NOTES ====================

    note = models.TextField(blank=True, default="")
    cancel_reason = models.TextField(blank=True, default="")

    # ==================== TIMESTAMPS ====================

    opened_at = models.DateTimeField(default=timezone.now, db_index=True)
    closed_at = models.DateTimeField(null=True, blank=True, db_index=True)
    canceled_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    history = HistoricalRecords()

    # ==================== DERIVED PROPERTIES ====================

    @property
    def subtotal_paid(self) -> Decimal:
        """
        Sum of amounts applied toward subtotal.
        This is the ONLY value used to determine payment completion.
        """
        from django.db.models import Sum

        return self.payments.filter(status="COMPLETED").aggregate(
            total=Sum("amount_applied")
        )["total"] or Decimal("0")

    @property
    def remaining_subtotal(self) -> Decimal:
        """
        Remaining amount required to fully cover subtotal.
        """
        return max(self.subtotal_amount - self.subtotal_paid, Decimal("0"))

    @property
    def is_fully_paid(self) -> bool:
        """
        Sale is fully paid when subtotal is fully covered.
        """
        return self.remaining_subtotal <= Decimal("0.01")

    @property
    def tax_amount(self) -> Decimal:
        """
        Derived total tax from all completed payments.
        """
        from django.db.models import Sum

        return self.payments.filter(status="COMPLETED").aggregate(
            total=Sum("tax_amount")
        )["total"] or Decimal("0")

    @property
    def discount_amount(self) -> Decimal:
        """
        Derived total discount from all completed payments.
        """
        from django.db.models import Sum

        return self.payments.filter(status="COMPLETED").aggregate(
            total=Sum("discount_amount")
        )["total"] or Decimal("0")

    @property
    def total_amount(self) -> Decimal:
        """
        Final payable amount (derived).
        Meaningful only AFTER closing.
        """
        return self.subtotal_amount - self.discount_amount + self.tax_amount

    @property
    def balance_due(self) -> Decimal:
        """
        Alias for remaining subtotal.
        Exists for API compatibility.
        """
        return self.remaining_subtotal

    # ==================== VALIDATION ====================

    def clean(self):
        super().clean()

        if self.subtotal_amount < 0:
            raise ValidationError(_("Subtotal cannot be negative"))

        if self.sale_type == self.SaleType.DINE_IN and not self.table:
            raise ValidationError(_("Dine-in sales must have a table"))

        if self.state == self.SaleState.CLOSED:
            if not self.closed_by or not self.closed_at:
                raise ValidationError(
                    _("Closed sale must have closed_by and closed_at")
                )

            if not self.is_fully_paid:
                raise ValidationError(
                    _("Sale cannot be closed until subtotal is fully paid")
                )

        if self.state == self.SaleState.CANCELED:
            if not self.canceled_by or not self.canceled_at or not self.cancel_reason:
                raise ValidationError(_("Canceled sale must have cancel metadata"))

    def save(self, *args, **kwargs):
        """
        Sale does NOT auto-calculate tax/discount/total.
        Those are derived from payments.

        Profit metrics are meaningful only after closing.
        """
        if self.state == self.SaleState.CLOSED:
            self.gross_profit = (self.total_amount - self.total_cost).quantize(
                Decimal("0.01")
            )

            if self.total_amount > 0:
                self.gross_margin_percent = (
                    (self.gross_profit / self.total_amount) * Decimal("100")
                ).quantize(Decimal("0.01"))
            else:
                self.gross_margin_percent = Decimal("0.00")

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Sale #{self.pk} ({self.state})"
