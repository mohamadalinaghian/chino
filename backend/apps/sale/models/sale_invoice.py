from __future__ import annotations

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _
from persiantools.jdatetime import JalaliDate


class SaleInvoice(models.Model):
    """
    Pure data model for sale invoices.
    All calculations and business logic in SaleInvoiceService.
    """

    class BillStatus(models.TextChoices):
        OPEN = "OPEN", _("Open")
        PARTIALLY_PAID = "PARTIAL", _("Partially paid")
        PAID = "PAID", _("Paid")
        REFUNDED = "REFUND", _("Refunded")

    # Core fields
    issue_date = models.DateTimeField(
        _("Issue date"), default=timezone.now, db_index=True
    )
    staff = models.ForeignKey(
        get_user_model(),
        on_delete=models.PROTECT,
        related_name="sale_invoices",
        verbose_name=_("Staff"),
        limit_choices_to={"is_staff": True},
    )
    customer = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        related_name="customer_invoices",
        null=True,
        blank=True,
        verbose_name=_("Customer"),
    )
    bill_status = models.CharField(
        _("Bill status"),
        max_length=16,
        choices=BillStatus.choices,
        default=BillStatus.OPEN,
        db_index=True,
    )

    cached_total_amount = models.DecimalField(
        _("Cached total amount"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0"),
    )
    total_paid = models.DecimalField(
        _("Cached total paid"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0"),
    )

    # Metadata
    note = models.TextField(_("Note"), blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @cached_property
    def jalali_issue_date(self) -> str:
        return JalaliDate(self.issue_date.date()).strftime("%c", locale="fa")

    class Meta:
        verbose_name = _("Sale Invoice")
        verbose_name_plural = _("Sale Invoices")
        ordering = ("-issue_date",)
        indexes = [
            models.Index(fields=["issue_date"]),
            models.Index(fields=["bill_status"]),
            models.Index(fields=["staff", "issue_date"]),
            models.Index(fields=["customer", "issue_date"]),
        ]

    def __str__(self) -> str:
        return f"#{self.pk} - {self.jalali_issue_date}"
