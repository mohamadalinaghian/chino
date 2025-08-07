from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.inventory.models.product import Product
from apps.utils.models import TimeStampedModel


class Recipe(TimeStampedModel):
    """
    This model will store metadata about recipes used in the system.
    final recipe will be stored in RecipeComponent model.

    is_countable will use to determine if the recipe is countable or not, and
    formula will be used to calculate the final product quantity.
    """

    CONSUM_TYPE = (
        (True, _("Yes")),
        (False, _("No")),
    )

    ALLOWED_RECIPE_PRODUCT_TYPES = ["PROCESSED", "MENU_ITEM", "CONSUMABLE"]

    product = models.ForeignKey(
        Product,
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

    is_countable = models.BooleanField(
        verbose_name=_("Is Countable"),
        default=False,
        choices=CONSUM_TYPE,
        help_text=_("Indicates if the product consum by number or weight."),
    )

    def clean(self) -> None:
        """Validate that the product is not of type RAW."""
        super().clean()
        if self.product.product_type == "RAW":
            raise ValueError(_("Recipe cannot be created for raw products."))

    def __str__(self) -> str:
        return f"{self.product.name} Recipe"

    class RecipeMeta:
        verbose_name = _("Recipe")
        verbose_name_plural = _("Recipes")
        ordering = ("product__name", "-updated_at")  # Newest recipes first
