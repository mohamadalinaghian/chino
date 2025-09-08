import pytest
from apps.inventory.admin.recipe import RecipeAdmin
from apps.inventory.models import Recipe
from apps.inventory.tests.factories import ProductFactory, RecipeFactory
from django.contrib.admin.sites import AdminSite


@pytest.mark.django_db
class TestRecipeAdmin:
    def setup_method(self):
        self.site = AdminSite()
        self.model_admin = RecipeAdmin(Recipe, self.site)

    def test_save_model_creates_recipe(self, rf):
        product = ProductFactory(type="PROCESSED")
        obj = Recipe(name="Admin Test", produced_product=product, instruction="Instr")

        request = rf.post("/admin/")
        self.model_admin.save_model(request, obj, form=None, change=False)

        assert Recipe.objects.filter(name="Admin Test").exists()

    def test_save_model_updates_recipe(self, rf):
        recipe = RecipeFactory(name="Admin Update", instruction="Old")
        recipe.instruction = "New"

        request = rf.post("/admin/")
        self.model_admin.save_model(request, recipe, form=None, change=True)

        recipe.refresh_from_db()
        assert recipe.instruction == "New"
