from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class SaleItem(models.Model):
    """
    An individual line item within a Sale.
    Items can be parents (Menu items) or children (Product).
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

    quantity = models.PositiveIntegerField(_("Quantity"))

    # Price Snapshots (History preservation)
    unit_price = models.PositiveIntegerField(
        _("Unit price"), help_text=_("Price at moment of sale")
    )
    material_cost = models.PositiveIntegerField(_("Material cost"), default=0)

    created_at = models.DateTimeField(_("Created at"), default=timezone.now)

    class Meta:
        ordering = ("created_at",)
        indexes = [
            models.Index(fields=["sale"]),
        ]

    def __str__(self) -> str:
        return f"{self.product} x {self.quantity}"
