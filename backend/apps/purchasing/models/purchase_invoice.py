from decimal import Decimal
from django.db import models
from django.forms import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.conf import settings
from apps.utils.models import TimeStampedModel


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

    issue_date = models.DateField(_("Issue Date"), default=timezone.now, db_index=True)
    purchase_date = models.DateField(_("Purchase Date"), default=timezone.now)

    supplier_name = models.ForeignKey(
        "purchasing.Supplier",
        verbose_name=_("Supplier Name"),
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

    tax_amount = models.DecimalField(
        _("Tax Amount"),
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.0"),
        help_text=_("Global tax amount to apply on total invoice."),
    )

    extra_cost = models.DecimalField(
        _("Extra Cost"),
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.0"),
        help_text=_("Any additional cost like shipping, handling, etc."),
    )

    note = models.TextField(_("Note"), blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_("Registered By"),
    )

    status = models.CharField(
        _("Status"),
        max_length=20,
        choices=PurchaseInvoiceStatus.choices,
    )

    class Meta:
        verbose_name = _("Purchase Invoice")
        verbose_name_plural = _("Purchase Invoices")
        ordering = ["-issue_date"]
        indexes = [
            models.Index(fields=["issue_date", "status"]),
        ]

    def __str__(self):
        return f"Invoice #{self.pk} - {self.issue_date}"

    def clean(self):
        if self.purchase_date > timezone.now().date():
            raise ValidationError(_("Purchase date cannot be in the future"))
        if self.issue_date < self.purchase_date:
            raise ValidationError(_("Issue date cannot be before purchase date"))

    @property
    def total_cost(self):
        """
        Sum of item total prices.
        """
        from django.db.models import Sum, F

        return self.items.aggregate(total=Sum(F("quantity") * F("unit_price")))[
            "total"
        ] or Decimal("0.00")

    @property
    def final_cost(self):
        """
        Final payable cost after discount, tax, and extra cost.
        """
        return (
            self.total_cost - self.discount_amount + self.tax_amount + self.extra_cost
        )
