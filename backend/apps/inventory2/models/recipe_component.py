from decimal import Decimal
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class RecipeComponent(models.Model):
    """
    Stores a single component (ingredient/product) for a given recipe.
    - Each component is a product with a defined quantity.
    - Used for calculating production cost and stock deduction.
    """

    recipe = models.ForeignKey(
        "inventory.Recipe",
        on_delete=models.CASCADE,
        related_name="components",
        verbose_name=_("Recipe"),
        help_text=_("The recipe this component belongs to."),
    )

    component = models.ForeignKey(
        "inventory.Product",
        on_delete=models.PROTECT,
        related_name="recipe_usages",
        verbose_name=_("Component"),
        help_text=_("The product (ingredient) used in this recipe."),
    )

    quantity = models.DecimalField(
        verbose_name=_("Quantity"),
        max_digits=10,
        decimal_places=3,
        default=Decimal("0.000"),
        help_text=_("Amount of product used in this recipe."),
    )

    note = models.CharField(
        verbose_name=_("Note"),
        max_length=125,
        blank=True,
        null=True,
        help_text=_("Optional note about this component."),
    )

    def clean(self):
        """Prevent circular references and invalid quantities."""
        super().clean()
        if self.recipe and self.component == self.recipe.product:
            raise ValidationError(
                {"product": _("A product cannot be a component of its own recipe.")}
            )
        if self.quantity <= 0:
            raise ValidationError(
                {"quantity": _("Quantity must be greater than zero.")}
            )

    def __str__(self):
        return f"{self.component.name} ({self.quantity})"

    class Meta:
        verbose_name = _("Recipe Component")
        verbose_name_plural = _("Recipe Components")
        ordering = ("recipe", "component__name")
        unique_together = ("recipe", "component")
        indexes = [
            models.Index(fields=["recipe", "component"]),
        ]
