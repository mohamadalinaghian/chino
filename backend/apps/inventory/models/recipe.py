from django.db import models
from django.forms import ValidationError
from django.utils.translation import gettext_lazy as _
from apps.utils.models import TimeStampedModel


class Recipe(TimeStampedModel):
    """
    This model will store metadata about recipes used in the system.
    final recipe will be stored in RecipeComponent model.
    """

    ALLOWED_RECIPE_PRODUCT_TYPES = ["PROCESSED", "MENU_ITEM", "CONSUMABLE"]

    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.CASCADE,
        related_name="recipes",
        limit_choices_to={"product_type__in": ALLOWED_RECIPE_PRODUCT_TYPES},
        db_index=True,
    )
    instruction = models.CharField(
        verbose_name=_("Instruction"), max_length=255, blank=True, null=True
    )
    prepared_time = models.PositiveSmallIntegerField(
        verbose_name=_("Prepared Time (in minutes)"),
        default=0,
        blank=True,
    )

    def clean(self) -> None:
        """Validate that the product is not of type RAW."""
        super().clean()
        if self.product.product_type == "RAW":
            raise ValidationError(_("Recipe cannot be created for raw products."))

    def __str__(self) -> str:
        return f"{self.product.name} "

    class Meta:
        verbose_name = _("Recipe")
        verbose_name_plural = _("Recipes")
        ordering = ("product__name", "-updated_at")  # Newest recipes first
