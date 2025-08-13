from django.db import models
from django.forms import ValidationError
from django.utils.translation import gettext_lazy as _
from apps.utils.models import TimeStampedModel
from django.contrib.auth import get_user_model


class ItemProduction(TimeStampedModel):
    """
    Represents the production process of a product.

    This model does not directly handle business logic such as cost calculation
    or stock adjustments. All business logic is delegated to service layers.

    Fields:
        product: The product being produced.
        recipe: The recipe used for production (optional).
        input_quantity: Total quantity of input materials used in production.
        output_quantity: Total quantity of finished product obtained.
        unit_cost: Cost per unit of the finished product.
        total_cost: Total cost of this production batch.
        notes: Optional notes about the production (e.g., reasons for yield loss).
    """

    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.PROTECT,
        related_name="productions",
        verbose_name=_("Product"),
        db_index=True,
    )

    recipe = models.ForeignKey(
        "inventory.Recipe",
        on_delete=models.SET_NULL,
        related_name="productions",
        verbose_name=_("Recipe"),
        null=True,
        blank=True,
    )

    input_quantity = models.DecimalField(
        verbose_name=_("Input Quantity"),
        help_text=_("Total quantity of input materials (before production loss)"),
        max_digits=10,
        decimal_places=3,
    )

    output_quantity = models.DecimalField(
        verbose_name=_("Output Quantity"),
        help_text=_("Total quantity of product obtained after production"),
        max_digits=10,
        decimal_places=3,
    )

    unit_cost = models.DecimalField(
        verbose_name=_("Unit Cost"),
        help_text=_("Cost per unit of finished product"),
        max_digits=12,
        decimal_places=4,
    )

    total_cost = models.DecimalField(
        verbose_name=_("Total Cost"),
        help_text=_("Total cost of this production batch"),
        max_digits=14,
        decimal_places=4,
    )

    creators = models.ManyToManyField(
        get_user_model(),
        verbose_name=_("Creators"),
        related_name="produced_items",
        limit_choices_to={"is_staff": True},
    )
    notes = models.CharField(
        verbose_name=_("Notes"),
        max_length=255,
        blank=True,
        null=True,
    )

    def clean(self):
        """
        Validate that creators are staff members.
        """
        super().clean()
        if self.recipe and self.recipe.product_id != self.product_id:
            raise ValidationError(_("Selected recipe does not belong to this product."))
        if not self.creators.filter(is_staff=True).all():
            raise ValidationError(_("Creators must be staff members."))

    def __str__(self):
        return f"{self.product.name} - {self.output_quantity} @ {self.unit_cost}"

    class Meta:
        verbose_name = _("Item Production")
        verbose_name_plural = _("Item Productions")
        ordering = ("-created_at",)
