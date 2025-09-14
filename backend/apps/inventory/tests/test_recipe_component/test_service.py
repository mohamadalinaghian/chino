import pytest
from apps.inventory.services.recipe_component import RecipeComponentService
from apps.inventory.tests.factories import RecipeComponentFactory, RecipeFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestRecipeComponentService:
    def test_normalize_success(self):
        recipe = RecipeFactory()
        RecipeComponentFactory(recipe=recipe, quantity=600)
        RecipeComponentFactory(recipe=recipe, quantity=400)

        RecipeComponentService.normalize_quantity(recipe.id)

        components = recipe.components.all()
        total = sum(c.quantity for c in components)

        assert pytest.approx(float(total), rel=1e-6) == 1.0

    def test_normalize_already_normalized(self):
        recipe = RecipeFactory()
        RecipeComponentFactory(recipe=recipe, quantity=0.6)
        RecipeComponentFactory(recipe=recipe, quantity=0.4)

        RecipeComponentService.normalize_quantity(recipe.id)

        comps = list(recipe.components.all())
        assert float(comps[0].quantity) == 0.6
        assert float(comps[1].quantity) == 0.4

    def test_normalize_recipe_not_exists(self):
        with pytest.raises(ValidationError):
            RecipeComponentService.normalize_quantity(9999)

    def test_normalize_zero_total(self):
        recipe = RecipeFactory()
        RecipeComponentFactory(recipe=recipe, quantity=0)

        with pytest.raises(ValidationError):
            RecipeComponentService.normalize_quantity(recipe.id)
