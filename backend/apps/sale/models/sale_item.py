from decimal import Decimal

from apps.inventory.models import Product
from django.db import models
from django.utils.translation import gettext_lazy as _


class SaleItem(models.Model):
    """
    An individual line item within a Sale.
    Items can be parents (Menu items) or children (Extras).
    """

    sale = models.ForeignKey(
        "sale.Sale",
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.PROTECT,
        related_name="sale_items",
        limit_choices_to={"type__in": (Product.ProductType.SELLABLE,)},
    )

    # Self-referential FK for Extras
    parent_item = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="extras",
        on_delete=models.CASCADE,
        help_text=_("If set, this item is an extra attached to the parent"),
    )

    quantity = models.DecimalField(max_digits=10, decimal_places=3)

    # Price Snapshots (History preservation)
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=4, help_text=_("Price at moment of sale")
    )
    material_cost = models.DecimalField(
        max_digits=12, decimal_places=4, default=Decimal("0")
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)
        indexes = [
            models.Index(fields=["sale"]),
        ]

    def __str__(self) -> str:
        return f"{self.product} x {self.quantity}"
