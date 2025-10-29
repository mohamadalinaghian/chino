from decimal import Decimal
from typing import List, Tuple

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from ..models import Product, Recipe


class RecipeService:
    """
    Controll writing recipe for acceptable products.
    """

    FRACTION_MAP = {
        Decimal("0.667"): (2, 3),
        Decimal("0.333"): (1, 3),
        Decimal("0.167"): (1, 6),
        Decimal("0.833"): (5, 6),
    }

    @staticmethod
    def validate_product(product):
        """
        Product.type must be PROCESSED or SELLABLE.
        """
        _valid_type = (Product.ProductType.PROCESSED, Product.ProductType.SELLABLE)
        if product.type in _valid_type:
            return True

        raise ValidationError(_("You can not write recipe for this type of product"))

    @staticmethod
    def create_or_update_recipe(
        name: str, product: Product, instruction: str
    ) -> Tuple[Recipe, bool]:
        # Check product type
        RecipeService.validate_product(product)

        return Recipe.objects.update_or_create(
            name=name, produced_product=product, defaults={"instruction": instruction}
        )

    @staticmethod
    def get_all_ingredients(recipe) -> List[Tuple[int, Decimal]]:
        """
        Returns [(product_id, exact_ratio_per_1g_output), ...]
        """
        result = []
        for comp in recipe.components.all():
            raw = comp.quantity.quantize(Decimal("0.001"))  # 1 mg precision
            num, den = RecipeService.FRACTION_MAP.get(raw, (None, None))
            ratio = Decimal(num) / Decimal(den) if num and den else Decimal(raw)
            result.append((comp.consume_product.id, ratio))
        return result
