from decimal import Decimal

import pytest
from apps.inventory.models import Product, Recipe
from apps.inventory.services.recipe import RecipeService
from apps.inventory.tests.factories import ProductFactory, RecipeFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestRecipeService:
    def test_validate_product_accepts_valid_types(self):
        product = ProductFactory(type=Product.ProductType.PROCESSED)
        assert RecipeService.validate_product(product) is True

        product = ProductFactory(type=Product.ProductType.SELLABLE)
        assert RecipeService.validate_product(product) is True

    def test_validate_product_rejects_invalid_types(self):
        product = ProductFactory(type=Product.ProductType.RAW)
        with pytest.raises(ValidationError):
            RecipeService.validate_product(product)

    def test_create_recipe_success(self):
        product = ProductFactory(type=Product.ProductType.SELLABLE)
        recipe, created = RecipeService.create_or_update_recipe(
            "Test Recipe", product, "Instruction"
        )
        assert created is True
        assert isinstance(recipe, Recipe)
        assert recipe.produced_product == product

    def test_update_recipe_success(self):
        recipe = RecipeFactory(name="Test Recipe", instruction="Old")
        product = recipe.produced_product
        updated, created = RecipeService.create_or_update_recipe(
            "Test Recipe", product, "New Instruction"
        )
        assert created is False
        assert updated.instruction == "New Instruction"

    def test_get_all_ingredients(self):
        product = ProductFactory(type=Product.ProductType.SELLABLE)
        recipe = RecipeFactory(produced_product=product)
        ingredient_1 = recipe.components.create(
            consume_product=ProductFactory(type=Product.ProductType.PROCESSED),
            quantity=Decimal("2.00"),
        )
        ingredient_2 = recipe.components.create(
            consume_product=ProductFactory(type=Product.ProductType.SELLABLE),
            quantity=Decimal("3.00"),
        )

        ingredients = RecipeService.get_all_ingredients(recipe)
        assert len(ingredients) == 2
        assert ingredients[0] == (
            ingredient_1.consume_product.id,
            ingredient_1.quantity,
        )
        assert ingredients[1] == (
            ingredient_2.consume_product.id,
            ingredient_2.quantity,
        )
