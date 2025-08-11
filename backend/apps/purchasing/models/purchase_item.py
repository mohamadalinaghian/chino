from decimal import Decimal
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.purchasing.managers.purchase_item import PurchaseItemManager


class PurchaseItem(models.Model):
    """
    Represents an individual item entry in a purchase invoice.
    """

    purchase_invoice = models.ForeignKey(
        "purchasing.PurchaseInvoice",
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("Purchase Invoice"),
    )

    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.PROTECT,
        verbose_name=_("Product"),
        related_name=("purchases"),
    )

    quantity = models.DecimalField(
        _("Quantity"),
        max_digits=10,
        decimal_places=2,
        help_text=_("Purchased quantity of the product"),
    )

    unit_price = models.DecimalField(
        _("Unit Price"),
        max_digits=10,
        decimal_places=2,
        help_text=_("Unit purchase price of the product (before tax or discount)"),
    )

    expiry_date = models.DateField(
        _("Expiry Date"),
        null=True,
        blank=True,
        help_text=_("Only required for perishable products"),
    )

    note = models.CharField(
        _("Note"),
        max_length=255,
        blank=True,
    )

    objects = PurchaseItemManager()

    class Meta:
        verbose_name = _("Purchase Item")
        verbose_name_plural = _("Purchase Items")
        ordering = ["-created"]

    def __str__(self):
        return f"{self.product.name} - {self.purchase_invoice.issue_date}"
