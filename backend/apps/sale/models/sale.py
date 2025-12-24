from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from simple_history.models import HistoricalRecords

User = get_user_model()


class Sale(models.Model):
    """
    Represents the header of a sales transaction.
    State management is strict; business logic resides in Services.

    Attributes:
        state: Current lifecycle state (OPEN/CLOSED/CANCELED)
        sale_type: Service method (DINE_IN/TAKEAWAY)
        table: Associated table for dine-in orders
        guest_count: Number of guests at the table
        guest: Optional registered customer
        opened_by: Staff member who created the sale
        closed_by: Staff member who finalized the sale
        total_amount: Cached sum of all line items
        note: Additional information or special requests
        opened_at: Timestamp when sale was created
        closed_at: Timestamp when sale was finalized
        created_at: Record creation timestamp
        updated_at: Record last modification timestamp
    """

    class State(models.TextChoices):
        OPEN = "OPEN", _("Open")
        CLOSED = "CLOSED", _("Closed")
        CANCELED = "CANCELED", _("Canceled")

    class SaleType(models.TextChoices):
        DINE_IN = "DINE_IN", _("Dine in")
        TAKEAWAY = "TAKEAWAY", _("Takeaway")

    # ---- Identity & Lifecycle ----
    state = models.CharField(
        _("State"),
        max_length=16,
        choices=State.choices,
        default=State.OPEN,
        db_index=True,
    )
    sale_type = models.CharField(
        _("Sale type"),
        max_length=16,
        choices=SaleType.choices,
    )

    # ---- Context ----
    table = models.ForeignKey(
        "inventory.Table",
        models.PROTECT,
        verbose_name=_("Table"),
        related_name="sales",
        null=True,
        blank=True,
    )
    guest_count = models.PositiveSmallIntegerField(
        _("Guest count"), null=True, blank=True
    )

    # ---- User Associations (Audit) ----
    guest = models.ForeignKey(
        User,
        verbose_name=_("Guest"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="guest_sales",
    )
    opened_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        verbose_name=_("Opened by"),
        related_name="opened_sales",
    )

    closed_by = models.ForeignKey(
        User,
        verbose_name=_("Closed by"),
        on_delete=models.PROTECT,
        related_name="closed_sales",
        null=True,
        blank=True,
    )

    # ---- Financials (Cached) ----
    total_amount = models.DecimalField(
        _("Total amount"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0"),
        help_text=_("Denormalized sum of item totals"),
    )

    # ---- Metadata ----
    note = models.TextField(_("Note"), blank=True, default="")
    opened_at = models.DateTimeField(_("Opened at"), default=timezone.now)
    closed_at = models.DateTimeField(_("Closed at"), null=True, blank=True)
    created_at = models.DateTimeField(_("Created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated at"), auto_now=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ("-opened_at",)
        indexes = [
            models.Index(fields=["state"]),
            models.Index(fields=["opened_at"]),
            models.Index(fields=["closed_at"]),
            models.Index(fields=["state", "opened_at"]),
            models.Index(fields=["table", "state"]),
        ]
        permissions = [
            ("open_sale", "Can open a sale"),
            ("modify_sale", "Can modify an open sale"),
            ("close_sale", "Can close a sale"),
            ("cancel_sale", "Can cancel a sale"),
            ("view_sale_list", "Can view sale list"),
            ("view_sale_detail", "Can view sale details"),
        ]

    def __str__(self) -> str:
        table_info = f" - {self.table.number}" if self.table else ""
        return f"Sale #{self.pk} ({self.state}){table_info}"
