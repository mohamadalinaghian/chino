from django.db import models
from django.utils.translation import gettext_lazy as _


class Product(models.Model):
    """
    Store any kind of product metadata.
    Example:
        Raw Material
            milk, onion, coffee bean, garlic, oil
        Processed item
            roast beef, vanilla milk,
        Sell item
            espresso, cheese burger, shake, pasta
        Consumable
            toilet paper, soap
    """

    BOOLEANTEXT = ((True, _("Yes")), (False, _("No")))

    class ProductType(models.TextChoices):
        RAW = "RAW", _("Raw Material")
        PROCESSED = "PROCESSED", _("Processed Material")
        SELLABLE = "SELLABLE", _("Sellable")
        CONSUMABLE = "Consumable", _("Consumable")

    # Fields
    name = models.CharField(_("Name"), max_length=128, db_index=True)
    is_expiry_traceable = models.BooleanField(
        _("Expiry Traceable"), choices=BOOLEANTEXT
    )
    is_countable = models.BooleanField(_("Countable"), choices=BOOLEANTEXT)
    type = models.CharField(
        _("Product Type"), max_length=15, choices=ProductType.choices, db_index=True
    )
    is_stock_traceable = models.BooleanField(_("Stock Traceable"), choices=BOOLEANTEXT)
    is_active = models.BooleanField(_("Is Active Product"), choices=BOOLEANTEXT)
    note = models.CharField(_("Note"), max_length=128, null=True, blank=True)

    # Methods
    def __str__(self):
        return str(self.name)

    # Meta
    class Meta:
        app_label = "inventory"
        verbose_name = _("Product")
        verbose_name_plural = _("Products")
        ordering = ("type",)
        indexes = (
            models.Index(
                fields=("is_active",),
                name="is_active_idx",
                condition=models.Q(is_active=True),
            ),
        )
        constraints = (
            models.UniqueConstraint(
                fields=("name", "type"),
                name="uq_product_name_type",
            ),
        )
