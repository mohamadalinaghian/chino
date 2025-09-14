from django.db import models
from django.utils.translation import gettext_lazy as _


class RecipeComponent(models.Model):
    """
    All components of a recipe will be stored here with their usage amounts.
    """

    # Fields
    recipe = models.ForeignKey(
        "inventory.Recipe",
        models.CASCADE,
        verbose_name=_("Recipe component"),
        related_name="components",
        db_index=True,
    )
    consume_product = models.ForeignKey(
        "inventory.Product",
        models.PROTECT,
        verbose_name=_("Consumed product"),
        related_name="recipies_consume",
    )
    quantity = models.DecimalField(
        _("Quantity"),
        max_digits=10,
        decimal_places=3,
        help_text=_("quantity of product consumed in 1 atomic unit of recipe."),
    )

    # Methodes
    def __str__(self) -> str:
        return f"{self.recipe}: {self.consume_product}"

    # Meta
    class Meta:
        verbose_name = _("Recipe component")
        verbose_name_plural = _("Recipe components")
        unique_together = ("recipe", "consume_product")
