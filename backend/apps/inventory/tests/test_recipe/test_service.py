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
