from django.db import models
from decimal import Decimal
from django.utils.translation import gettext_lazy as _
from apps.utils.models import TimeStampedModel


class StockEntry(TimeStampedModel):
    """
    Record representing a batch of inventory for a product.

    Each StockEntry is created when a PurchaseItem is processed (FIFO entry).
    Tracks remaining quantity and unit cost. Used for consumption in production.
    """

    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.CASCADE,
        related_name="stock_entries",
        verbose_name=_("Product"),
        db_index=True,
    )
    source = models.ForeignKey(
        "purchasing.PurchaseItem",
        on_delete=models.PROTECT,
        related_name="stock_entries",
        verbose_name=_("Purchase Source"),
    )
    quantity_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name=_("Total Quantity"),
        help_text=_("Initial quantity received from the purchase source."),
    )
    quantity_remaining = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name=_("Remaining Quantity"),
        help_text=_("Remaining quantity available for consumption."),
    )
    unit_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name=_("Unit Cost"),
        help_text=_("Cost per unit as of purchase."),
    )
    is_remaining = models.BooleanField(
        default=True,
        verbose_name=_("Is Remaining"),
        help_text=_("Indicates if this entry still has remaining quantity."),
    )

    class Meta:
        verbose_name = _("Stock Entry")
        verbose_name_plural = _("Stock Entries")
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["product", "quantity_remaining"]),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.quantity_remaining}/{self.quantity_total}"

    def consume(self, amount: Decimal) -> Decimal:
        """
        Consume 'amount' from this StockEntry FIFO-style.
        Returns cost of consumed quantity.
        Raises error if amount exceeds remaining.
        """
        if amount > self.quantity_remaining:
            raise ValueError("Cannot consume more than remaining quantity")

        self.quantity_remaining -= amount
        cost = amount * self.unit_cost
        if self.quantity_remaining == 0:
            self.is_remaining = False
        self.save(update_fields=["quantity_remaining", "is_remaining"])
        return cost
