from decimal import Decimal

from django.db import models
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _


class PurchaseItem(models.Model):
    """
    Store every purchase item in a single record.
    """

    # Fields
    purchase_invoice = models.ForeignKey(
        "inventory.PurchaseInvoice",
        models.CASCADE,
        related_name="items",
        verbose_name=_("Purchase Invoice"),
        help_text=_("Invoice which item belongs to"),
        db_index=True,
    )
    purchased_product = models.ForeignKey(
        "inventory.Product",
        models.PROTECT,
        related_name="purchases",
        verbose_name=_("Purchased product"),
        db_index=True,
    )
    quantity = models.DecimalField(
        _("Quantity"),
        max_digits=10,
        decimal_places=2,
    )
    purchased_unit_price = models.DecimalField(
        _("Purchased unit price"), max_digits=10, decimal_places=4, blank=True
    )

    # Property
    @cached_property
    def total_cost(self):
        return Decimal(self.quantity * self.purchased_unit_price)

    # Methods
    def __str__(self) -> str:
        return f"{self.purchased_product}: {self.purchase_invoice}"

    # Meta
    class Meta:
        verbose_name = _("Purchase Item")
        verbose_name_plural = _("Purchase Items")
        ordering = ("purchase_invoice",)
        constraints = (
            models.UniqueConstraint(
                fields=("purchase_invoice", "purchased_product"),
                name="uq_purchase_item",
            ),
        )
