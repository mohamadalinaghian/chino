from typing import Tuple

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from ..models import Product, Recipe


class RecipeService:
    """
    Controll writing recipe for acceptable products.
    """

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
