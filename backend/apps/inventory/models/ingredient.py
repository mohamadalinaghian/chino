from django.db import models
from django.forms import ValidationError
from django.utils.translation import gettext_lazy as _
from .unit import Unit
from django.contrib.contenttypes.fields import GenericRelation

class Ingredient(models.Model):
    """
    A raw or processed material.
    ‘Raw’ items come from purchases.
    ‘Processed’ items are produced in‐house via recipes.
    """
    class IngredientType(models.TextChoices):
        RAW = "raw", _("Raw")
        PROCESSED = "processed", _("Processed")

    name = models.CharField(
        _("Name"),
        max_length=120,
        unique=True,
        db_index=True,
        help_text=_("E.g. 'Tomato', 'Salt', 'Beef Roast'"),
    )
    unit = models.ForeignKey(
        Unit,
        null=False,
        on_delete=models.PROTECT,
        verbose_name=_("Unit"),
        help_text=_("Atomic unit used for storage and calculation."),
    )
    ingredient_type = models.CharField(
        max_length=10,
        choices=IngredientType.choices,
        default=IngredientType.RAW,
    )
    recipes = GenericRelation("inventory.RecipeComponent")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
