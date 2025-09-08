import pytest
from apps.inventory.tests.factories import RecipeFactory
from django.utils import timezone


@pytest.mark.django_db
class TestRecipeModel:
    def test_create_obj(self):
        obj = RecipeFactory()
        assert obj.id is not None
        assert str(obj) == obj.name

    def test_jalali_created_at_and_updated_at(self):
        obj = RecipeFactory()
        obj.created_at = timezone.now()
        obj.updated_at = timezone.now()
        obj.save()

        assert isinstance(obj.jalali_created_at(), str)
        assert isinstance(obj.jalali_updated_at(), str)

    def test_jalali_methods_without_dates(self):
        obj = RecipeFactory()
        obj.created_at = None
        obj.updated_at = None
        assert obj.jalali_created_at() == "-"
        assert obj.jalali_updated_at() == "-"
