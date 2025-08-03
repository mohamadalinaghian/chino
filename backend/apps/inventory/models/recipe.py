# apps/inventory/models/recipe.py

from apps.utils.models import TimeStampedModel
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _


class Recipe(TimeStampedModel):
    """
    Represents the recipe for a single parent object (Ingredient[processed] or Menu item),
    including instructions and cooking/processing time.
    """

    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={
            "app_label__in": ["inventory", "menu"],
            "model__in": ["ingredient", "menu"],
        },
        verbose_name=_("Parent ContentType"),
    )
    object_id = models.PositiveIntegerField(verbose_name=_("Parent Object ID"))
    parent = GenericForeignKey("content_type", "object_id")

    instructions = models.TextField(
        _("Instructions"),
        help_text=_("Step-by-step instructions for preparing this item."),
        blank=True,
    )
    cook_time_minutes = models.PositiveIntegerField(
        _("Cook/Process Time (min)"),
        help_text=_("Estimated time in minutes to prepare/process."),
        default=0,
    )

    class Meta:
        verbose_name = _("Recipe")
        verbose_name_plural = _("Recipes")
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        return f"Recipe for {self.parent}"


class RecipeComponent(TimeStampedModel):
    """
    A line item in a Recipe: which Ingredient and how many atomic units.
    """

    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name="components",
        verbose_name=_("Recipe"),
    )
    component = models.ForeignKey(
        "inventory.Ingredient",
        on_delete=models.CASCADE,
        verbose_name=_("Component Ingredient"),
        help_text=_("Raw or processed ingredient."),
    )
    quantity = models.PositiveIntegerField(
        _("Quantity (atomic units)"),
        help_text=_("Number of units of the component per 1 parent unit."),
    )

    class Meta:
        verbose_name = _("Recipe Component")
        verbose_name_plural = _("Recipe Components")
        unique_together = [["recipe", "component"]]

    def __str__(self):
        return f"{self.component} x {self.quantity}"
