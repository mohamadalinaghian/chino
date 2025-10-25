from decimal import Decimal

from django.db import models
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _


class SaleItem(models.Model):
    """
    Store sale items.
    """

    class SaleMethod(models.TextChoices):
        """
        It's use for service to determine shape of consumption.
        """

        PHANTOM = "PHANTOM", _("Phantom")
        STOCK = "STOCK", _("Stock")

    # Fields
    sale_invoice = models.ForeignKey(
        "sale.SaleInvoice",
        models.CASCADE,
        verbose_name=_("Sale invoice"),
        related_name="items",
        db_index=True,
    )
    product = models.ForeignKey(
        "inventory.Product",
        models.PROTECT,
        verbose_name=_("Sold product"),
        related_name="sales",
        db_index=True,
    )
    quantity = models.DecimalField(_("Quantity"), max_digits=10, decimal_places=3)
    sold_unit_price = models.DecimalField(
        _("Sold unit price"), max_digits=10, decimal_places=4
    )
    discount_amount = models.DecimalField(
        _("Discount amount"), max_digits=10, decimal_places=4, null=True, blank=True
    )

    # Property
    @cached_property
    def total_cost(self):
        return Decimal(self.quantity * self.sold_unit_price)

    # Methods
    def __str__(self) -> str:
        return f"{self.product}: {self.sale_invoice}"

    # Meta
    class Meta:
        verbose_name = _("Sale item")
        verbose_name_plural = _("Sale items")
        ordering = ("sale_invoice",)
        constraints = (
            models.UniqueConstraint(
                fields=("sale_invoice", "product"),
                name="uq_sale_item",
            ),
        )
        indexes = [
            models.Index(fields=("sale_invoice",)),
            models.Index(fields=("product",)),
        ]
