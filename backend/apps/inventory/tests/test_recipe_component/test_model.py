import pytest
from apps.inventory.tests.factories import RecipeComponentFactory


@pytest.mark.django_db
class TestModel:
    def test_create_obj(self):
        obj = RecipeComponentFactory()

        assert obj.id is not None
        assert str(obj) == f"{obj.recipe}: {obj.consume_product}"

    def test_unique_together(self):
        obj = RecipeComponentFactory()

        with pytest.raises(Exception):
            RecipeComponentFactory(
                recipe=obj.recipe,
                consume_product=obj.consume_product,
            )
