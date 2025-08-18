from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from ..services.recipe_component_normalizer import normalize_components

from ...utils.models import TimeStampedModel


class Recipe(TimeStampedModel):
    """
    Metadata model for storing a recipe of a product.

    - Defines general instructions for preparing a product.
    - Restricts which product types are allowed to have recipes.
    - Final ingredient breakdown is stored in `RecipeComponent` model.
    """

    ALLOWED_RECIPE_PRODUCT_TYPES = ["PROCESSED", "MENU_ITEM", "CONSUMABLE"]

    name = models.CharField(
        verbose_name=_("Name"),
        max_length=255,
        unique=True,
        db_index=True,
        help_text=_("Unique name for the recipe."),
    )
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.CASCADE,
        related_name="recipes",
        limit_choices_to={"product_type__in": ALLOWED_RECIPE_PRODUCT_TYPES},
        verbose_name=_("Product"),
        db_index=True,
        help_text=_("The product that this recipe is for."),
    )

    instruction = models.CharField(
        verbose_name=_("Instruction"),
        max_length=255,
        blank=True,
        null=True,
        help_text=_("General preparation instructions."),
    )

    prepared_time = models.PositiveSmallIntegerField(
        verbose_name=_("Preparation Time (minutes)"),
        default=0,
        blank=True,
        help_text=_("Time needed to prepare this recipe."),
    )

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        with transaction.atomic():
            super().save(*args, **kwargs)
            # Only normalize if it's new or explicitly requested
            normalize_components(self)

    def clean(self):
        """
        Validates that the associated product type
        is allowed to have a recipe.
        """
        super().clean()
        if (
            self.product
            and self.product.product_type not in self.ALLOWED_RECIPE_PRODUCT_TYPES
        ):
            raise ValidationError(
                {"product": _("Recipe cannot be created for raw products.")}
            )

    def __str__(self):
        return f"{self.name}"

    class Meta:
        verbose_name = _("Recipe")
        verbose_name_plural = _("Recipes")
        ordering = ("product__name", "-updated_at")
        indexes = [
            models.Index(fields=["product", "-updated_at"]),
        ]
