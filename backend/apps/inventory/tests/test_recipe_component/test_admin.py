import pytest
from apps.inventory.admin.recipe import RecipeAdmin
from apps.inventory.models import Recipe
from apps.inventory.tests.factories import (
    ProductFactory,
    RecipeComponentFactory,
    RecipeFactory,
)
from django.contrib.admin.sites import AdminSite


class DummyForm:
    def __init__(self, instance):
        self.instance = instance

    def save_m2m(self):
        # no-op for tests
        pass


@pytest.mark.django_db
class TestRecipeAdmin:
    def setup_method(self):
        self.site = AdminSite()
        self.admin = RecipeAdmin(Recipe, self.site)

    def test_save_model_creates_or_updates_recipe(self):
        recipe = RecipeFactory()
        request = None
        form = None
        change = False

        self.admin.save_model(request, recipe, form, change)
        assert Recipe.objects.filter(id=recipe.id).exists()

    def test_save_related_normalizes_components(self):
        recipe = RecipeFactory()
        p1 = ProductFactory()
        p2 = ProductFactory()
        RecipeComponentFactory(recipe=recipe, consume_product=p1, quantity=5)
        RecipeComponentFactory(recipe=recipe, consume_product=p2, quantity=15)

        request = None
        form = DummyForm(recipe)
        formsets = []
        change = False

        self.admin.save_related(request, form, formsets, change)

        recipe.refresh_from_db()
        qs = recipe.components.order_by("id")
        total = sum([c.quantity for c in qs])
        assert pytest.approx(total, rel=1e-6) == 1
