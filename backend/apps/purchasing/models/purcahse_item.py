from decimal import Decimal
from django.db import models
from django.forms import ValidationError
from django.utils.translation import gettext_lazy as _


class PurchaseItem(models.Model):
    """
    List of purchases in invoice model.
    """

    purchase_invoice = models.ForeignKey(
        to="purchasing.PurchaseInvoice",
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("Purchase Invoice"),
    )
    item = models.ForeignKey(
        to="inventory.Product",
        on_delete=models.PROTECT,
        verbose_name=_("Item"),
        limit_choices_to={"product_type": ["RAW", "CONSUMABLE"]},
        related_name="purchase_invoice_items",
    )
    quantity = models.DecimalField(
        _("Quantity"),
        max_digits=10,
        decimal_places=1,
        help_text=_("Quantity of the item purchased regardless of the unit"),
    )
    unit_price = models.DecimalField(
        _("Unit Price"),
        max_digits=10,
        decimal_places=1,
        help_text=_("Price per unit of the item"),
        null=True,
        blank=True,
    )
    total_price = models.DecimalField(
        _("Total Price"),
        max_digits=10,
        decimal_places=1,
        help_text=_("Total price for the item (quantity * unit price)"),
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = _("Purchase Invoice Item")
        verbose_name_plural = _("Purchase Invoice Items")
        ordering = ["-purchase_invoice__issue_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["purchase_invoice", "item"],
                name="unique_purchase_invoice_item",
            )
        ]

    def __str__(self):
        return f"{self.item} - {self.quantity} @ {self.unit_price} each"

    def clean(self):
        if self.quantity <= 0:
            raise ValueError(_("Quantity must be greater than zero."))

        if self.item.product_type not in ["RAW", "CONSUMABLE"]:
            raise ValueError(_("Item must be of type RAW or CONSUMABLE."))

        if not self.unit_price and not self.total_price:
            raise ValidationError("Either unit_price or total_price must be provided.")

        if self.unit_price and self.total_price:
            expected_total = self.unit_price * self.quantity
            if round(expected_total, 2) != round(self.total_price, 2):
                raise ValidationError(
                    f"unit_price: {self.unit_price} × quantity: {self.quantity} doesn't match total_price: {self.total_price}."
                )

    def get_total_price(self):
        if self.total_price:
            return self.total_price
        elif self.unit_price:
            return self.unit_price * self.quantity
        return None

    def get_unit_price(self):
        if self.unit_price:
            return self.unit_price
        elif self.total_price and self.quantity:
            return self.total_price / self.quantity
        return None
