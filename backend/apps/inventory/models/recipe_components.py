from django.db import models
from django.utils.translation import gettext_lazy as _
from treebeard.mp_tree import MP_Node


class RecipeComponent(models.Model):
    """
    This model will store the components of a recipe.
    It allows for hierarchical relationships between components,
    enabling complex recipes with sub-components.
    """

    recipe = models.ForeignKey(
        to="inventory.Recipe",
        verbose_name=_("Product"),
        on_delete=models.CASCADE,
        related_name="recipe_components",
    )
    component = models.ForeignKey(
        to="inventory.Product",
        verbose_name=_("Component"),
        on_delete=models.CASCADE,
        related_name="recipe_components",
    )
    quantity = models.DecimalField(
        verbose_name=_("Quantity"),
        decimal_places=1,
        max_digits=6,
    )

    def __str__(self):
        return f"{self.recipe} - {self.component} ({self.quantity})"

    class Meta:
        verbose_name = _("Recipe Component")
        verbose_name_plural = _("Recipe Components")
        ordering = ["parent_recipe", "component"]
        constraints = [
            models.UniqueConstraint(
                fields=["parent_recipe", "component"], name="unique_recipe_component"
            )
        ]
