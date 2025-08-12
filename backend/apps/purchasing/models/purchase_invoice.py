from decimal import Decimal
from django.db import models
from django.forms import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.conf import settings
from ...utils.models import TimeStampedModel

from ..managers.purchase_invoice import PurchaseInvoiceManager


class PurchaseInvoiceStatus(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")
    CONFIRMED = "CONFIRMED", _("Confirmed")
    CANCELED = "CANCELED", _("Canceled")
    RETURNED = "RETURNED", _("Returned")


class PurchaseInvoice(TimeStampedModel):
    """
    PurchaseInvoice represents a single purchase event from a supplier.
    It holds metadata like discount, tax, etc.
    """

    issue_date = models.DateField(
        _("Issue Date"),
        default=timezone.now,
        db_index=True,
        help_text=_("The date that invoice was issued."),
    )

    supplier = models.ForeignKey(
        "purchasing.Supplier",
        verbose_name=_("Supplier Name"),
        related_name="invoices",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    discount_amount = models.DecimalField(
        _("Discount Amount"),
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.0"),
        help_text=_(
            "Total discount applied to the invoice. This does not affect item unit prices."
        ),
    )

    note = models.CharField(_("Note"), max_length=255, null=True, blank=True)

    invoice_final_cost = models.DecimalField(
        _("Invoice Final Cost"),
        max_digits=10,
        decimal_places=2,
        help_text=_("Final cost after applying tax and discount"),
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_("Registered By"),
    )

    status = models.CharField(
        _("Status"), max_length=20, choices=PurchaseInvoiceStatus.choices, db_index=True
    )

    objects = PurchaseInvoiceManager()

    class Meta:
        verbose_name = _("Purchase Invoice")
        verbose_name_plural = _("Purchase Invoices")
        ordering = ["-issue_date"]
        indexes = [
            models.Index(fields=["issue_date", "status"]),
        ]

    def __str__(self):
        return f"{_("Invoice")} #{self.pk} - {self.issue_date}"

    def clean(self):
        if self.issue_date > timezone.now().date():
            raise ValidationError(_("Purchase date cannot be in the future"))
