from __future__ import annotations

from decimal import Decimal

from django.db import models
from django.utils.translation import gettext_lazy as _


class SaleItem(models.Model):
    """
    Pure data model for sale items.
    All price calculations in SaleItemService.
    """

    class SaleType(models.TextChoices):
        STOCK = "STOCK", _("From Stock")
        PHANTOM = "PHANTOM", _("Made to Order")

    sale_invoice = models.ForeignKey(
        "sale.SaleInvoice",
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("Sale invoice"),
    )
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.PROTECT,
        verbose_name=_("Product"),
        related_name="sale_items",
    )
    quantity = models.DecimalField(
        _("Quantity"),
        max_digits=10,
        decimal_places=3,
    )
    unit_price = models.DecimalField(
        _("Unit price"),
        max_digits=12,
        decimal_places=4,
    )
    discount_amount = models.DecimalField(
        _("Discount amount"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0"),
    )
    material_cost = models.DecimalField(
        _("Material cost (COGS)"),
        max_digits=12,
        decimal_places=4,
        default=Decimal("0"),
        help_text=_("Cost of goods sold for this item"),
    )
    sale_method = models.CharField(
        _("Sale method"),
        max_length=16,
        choices=SaleType.choices,
        default=SaleType.STOCK,
        help_text=_("Whether item was sold from stock or made to order"),
    )
    stock_consumed = models.BooleanField(
        _("Stock consumed"),
        default=True,
        help_text=_("Whether stock has been consumed for this item"),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Sale item")
        verbose_name_plural = _("Sale items")
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["sale_invoice", "product"],
                name="unique_product_per_invoice",
            )
        ]
        indexes = [
            models.Index(fields=["sale_invoice", "product"]),
        ]

    def __str__(self) -> str:
        return f"{self.product} x {self.quantity}"
