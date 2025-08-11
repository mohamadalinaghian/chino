from django.db import models
from django.utils.translation import gettext_lazy as _

from ..managers.product import ProductManager


class Product(models.Model):
    """
    This model will store all the ingredients uses in system.
    e.g tomato, coffee, meet, cheese, salt (RAW type).
        tomato sauce, spice mix (Processed type).
        espresso, pizza, salad (MenuItem type).
        soap, toilet-paper (Consumable type).

    It's unitless.
    For purposes of using FIFO unit price calculation,
    live price will store in StockEntry.
    Is_countable will use to determine if the recipe is countable or not,
    and determine which formula will be used to calculate the final product quantity.
    """

    CONSUME_TYPE = (
        (True, _("Yes")),
        (False, _("No")),
    )

    class ProductType(models.TextChoices):
        RAW = "RAW", _("Raw Ingredient")
        PROCESSED = "PROCESSED", _("Processed Ingredient")
        MENU_ITEM = "MENU_ITEM", _("Menu Item")
        CONSUMABLE = "CONSUMABLE", _("Consumable")

    name = models.CharField(
        verbose_name=_("Name"), max_length=50, unique=True, db_index=True
    )
    description = models.CharField(
        verbose_name=_("Description"), max_length=255, blank=True, null=True
    )
    product_type = models.CharField(
        _("Product Type"),
        max_length=20,
        choices=ProductType.choices,
        default=ProductType.RAW,
        db_index=True,
    )

    is_countable = models.BooleanField(
        verbose_name=_("Is Countable"),
        default=False,
        choices=CONSUME_TYPE,
        help_text=_("Indicates if the product consume by number or weight."),
    )
    track_inventory = models.BooleanField(
        verbose_name=_("Track Inventory"),
        default=False,
        help_text=_("Indicates if the product inventory should be tracked."),
    )

    is_active = models.BooleanField(_("Active"), default=True)

    objects = ProductManager()

    class Meta:
        verbose_name = _("Product")
        verbose_name_plural = _("Products")
        ordering = ["name"]
        indexes = [
            models.Index(fields=["product_type", "is_active"]),
        ]

    def __str__(self):
        return self.name
