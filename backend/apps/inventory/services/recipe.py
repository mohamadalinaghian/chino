from __future__ import annotations

from decimal import Decimal
from typing import List, Tuple

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from ..models import Product, Recipe


class RecipeService:
    """
    Recipe CRUD and ingredient extraction – fully type-safe.

    Works exclusively with ``Product`` and ``Recipe`` instances.
    """

    FRACTION_MAP = {
        Decimal("0.667"): (2, 3),
        Decimal("0.333"): (1, 3),
        Decimal("0.167"): (1, 6),
        Decimal("0.833"): (5, 6),
    }

    @staticmethod
    def _validate_product_type(product: Product) -> None:
        """Only PROCESSED or SELLABLE products may have recipes."""
        allowed = (Product.ProductType.PROCESSED, Product.ProductType.SELLABLE)
        if product.type not in allowed:
            raise ValidationError(
                _("You can not write a recipe for this type of product")
            )

    @staticmethod
    def create_or_update_recipe(
        name: str, product: Product, instruction: str
    ) -> Tuple[Recipe, bool]:
        """
        Create a new recipe or update an existing one.

        Args:
            name: Unique recipe name.
            product: The ``Product`` that the recipe produces.
            instruction: Human-readable preparation steps.

        Returns:
            Tuple ``(recipe_instance, created)`` – ``created`` is ``True`` for new objects.
        """
        RecipeService._validate_product_type(product)
        return Recipe.objects.update_or_create(
            name=name,
            produced_product=product,
            defaults={"instruction": instruction},
        )

    @staticmethod
    def get_all_ingredients(recipe: Recipe) -> List[Tuple[int, Decimal]]:
        """
        Return a list of ``(ingredient_product_id, ratio_per_1g_output)``.

        The ratio is exact (e.g. ``0.5`` for half a gram per gram of output).
        """
        result: List[Tuple[int, Decimal]] = []
        for comp in recipe.components.all():
            raw = comp.quantity.quantize(Decimal("0.001"))  # 1 mg precision
            num, den = RecipeService.FRACTION_MAP.get(raw, (None, None))
            ratio = Decimal(num) / Decimal(den) if num and den else Decimal(raw)
            result.append((comp.consume_product.id, ratio))
        return result
