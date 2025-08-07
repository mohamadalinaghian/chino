from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from apps.utils.models import TimeStampedModel

from decimal import Decimal


class PurchaseInvoice(TimeStampedModel):
    """
    Model representing a purchase invoice.
    """

    issue_date = models.DateField(_("Issue Date"), default=timezone.now, db_index=True)
    # supplier_name =  ### suplier model needed
    total_cost = models.DecimalField(
        _("Total Cost"),
        max_digits=10,
        decimal_places=1,
        help_text=_("Total Cost of items purchased"),
    )
    note = models.CharField(
        _("Note"),
        max_length=255,
        blank=True,
        help_text=_("Additional notes about the purchase invoice"),
    )
    discount_amount = models.DecimalField(
        _("Discount Amount"), max_digits=10, decimal_places=2, default=Decimal("0.00")
    )

    tax_amount = models.DecimalField(
        _("Tax Amount"),
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text=_("Total tax amount for the invoice"),
    )

    extra_cost = models.DecimalField(
        _("Extra Cost"),
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text=_("Any additional costs associated with the invoice"),
    )

    class Meta:
        verbose_name = _("Purchase Invoice")
        verbose_name_plural = _("Purchase Invoices")
        ordering = ["-issue_date"]

    def __str__(self):
        return f"Purchase Invoice {self.pk} - {self.issue_date.strftime('%Y-%m-%d')}"
