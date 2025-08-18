from decimal import Decimal
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext_lazy as _
from apps.utils.models import TimeStampedModel


class StockEntry(TimeStampedModel):
    """
    Neutral inventory transaction record.
    Does not decide business rules itself, just logs a stock movement
    that can later be aggregated for inventory calculation (e.g., FIFO).

    Examples:
        - Purchase of products from supplier (IN)
        - Production output (IN)
        - Consumption of ingredients for production (OUT)
        - Return to supplier (OUT)
        - Stock adjustment after physical inventory count (IN/OUT)
    """

    class MovementType(models.TextChoices):
        # IN
        PURCHASE_IN = "PURCHASE_IN", _("Purchase In")  # Bought from supplier
        PRODUCTION_IN = "PRODUCTION_IN", _("Production In")  # Produced finished goods
        RETURN_IN = "RETURN_IN", _("Return In")  # Returned from customer
        ADJUSTMENT_IN = "ADJUSTMENT_IN", _(
            "Adjustment In"
        )  # Inventory increase after count

        # OUT
        PRODUCTION_OUT = "PRODUCTION_OUT", _("Production Out")  # Raw material usage
        SALE_OUT = "SALE_OUT", _("Sale Out")  # Sold directly from stock
        RETURN_OUT = "RETURN_OUT", _("Return Out")  # Returned to supplier
        ADJUSTMENT_OUT = "ADJUSTMENT_OUT", _(
            "Adjustment Out"
        )  # Inventory decrease after count
        WASTE_OUT = "WASTE_OUT", _("Waste / Spoilage Out")

    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.CASCADE,
        related_name="stock_entries",
        verbose_name=_("Product"),
        db_index=True,
    )

    movement_type = models.CharField(
        verbose_name=_("Movement Type"),
        max_length=20,
        choices=MovementType.choices,
        db_index=True,
    )

    initial_quantity = models.DecimalField(
        verbose_name=_("Initial Quantity"),
        max_digits=10,
        decimal_places=2,
        help_text=_(
            "Amount moved in or out of stock. Positive for IN, negative for OUT."
        ),
    )

    remaining_quantity = models.DecimalField(
        verbose_name=_("Remaining Quantity"),
        max_digits=10,
        decimal_places=2,
        help_text=_(
            "Remaining amount from this entry after partial usage. "
            "Used for FIFO calculations."
        ),
    )

    unit_cost = models.DecimalField(
        verbose_name=_("Unit Cost"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("Cost per unit at the time of entry."),
    )

    # Generic relation to link this stock entry to its source document
    content_type = models.ForeignKey(
        ContentType, on_delete=models.SET_NULL, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    source_object = GenericForeignKey("content_type", "object_id")

    is_depleted = models.BooleanField(
        verbose_name=_("Is Depleted"),
        default=False,
        help_text=_("True if remaining_quantity is zero."),
    )

    from ..managers.stock_entry import StockEntryManager

    objects = StockEntryManager()

    class Meta:
        verbose_name = _("Stock Entry")
        verbose_name_plural = _("Stock Entries")
        ordering = ("-created_at",)  # Newest entries first
        indexes = [
            models.Index(fields=["product", "movement_type"]),
            models.Index(fields=["is_depleted", "product", "created_at"]),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.movement_type} - {self.initial_quantity}"

    def clean(self):
        """
        Ensure remaining_quantity is never greater than quantity.
        Also ensure quantity sign matches movement type.
        """
        from django.core.exceptions import ValidationError

        if abs(self.remaining_quantity) > abs(self.initial_quantity):
            raise ValidationError(_("Remaining quantity cannot exceed total quantity."))

        # Ensure quantity sign convention
        if (
            self.movement_type
            in {
                self.MovementType.PURCHASE_IN,
                self.MovementType.PRODUCTION_IN,
                self.MovementType.RETURN_IN,
                self.MovementType.ADJUSTMENT_IN,
            }
            and self.initial_quantity < 0
        ):
            raise ValidationError(_("IN movements must have positive quantity."))

        if (
            self.movement_type
            in {
                self.MovementType.PRODUCTION_OUT,
                self.MovementType.SALE_OUT,
                self.MovementType.RETURN_OUT,
                self.MovementType.ADJUSTMENT_OUT,
            }
            and self.initial_quantity > 0
        ):
            raise ValidationError(_("OUT movements must have negative quantity."))

    def save(self, *args, **kwargs):
        # keep is_depleted consistent with remaining_quantity
        try:
            self.is_depleted = Decimal(self.remaining_quantity) <= Decimal("0")
        except Exception:
            self.is_depleted = False
        super().save(*args, **kwargs)
