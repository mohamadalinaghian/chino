import math

from django.core.exceptions import ValidationError
from django.db.models import F, Sum
from django.utils.translation import gettext_lazy as _

from ..models import Recipe


class RecipeComponentService:
    """
    Used for normalizing consume quantities.
    Validate consume product.
    """

    @staticmethod
    def normalize_quantity(recipe_id: int) -> None:
        """
        Normalize the component quantities of a recipe so that their sum equals 1.
        """
        try:
            recipe = Recipe.objects.prefetch_related("components").get(id=recipe_id)
        except Recipe.DoesNotExist:
            raise ValidationError(_("Recipe does not exist"))

        total_quantity = (
            recipe.components.aggregate(total=Sum("quantity"))["total"] or 0
        )

        if total_quantity <= 0:
            raise ValidationError(_("Total quantity must be greater than zero."))

        # if already normalized, skip
        if math.isclose(total_quantity, 1, rel_tol=1e-6):
            return

        # update all components in a single query
        recipe.components.update(quantity=F("quantity") / total_quantity)
