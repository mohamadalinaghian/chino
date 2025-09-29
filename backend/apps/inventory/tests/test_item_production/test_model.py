from decimal import Decimal

import pytest
from apps.inventory.models import ItemProduction
from apps.inventory.tests.factories import ItemProductionFactory, RecipeFactory
from apps.user.tests.factories import AccountFactory


@pytest.mark.django_db
class TestItemProduction:

    def test_create_item_production(self):
        item_production = ItemProductionFactory()

        assert item_production.used_recipe is not None
        assert item_production.used_quantity > 0
        assert item_production.produced_quantity > 0
        assert (
            item_production.cooperators.count() == 1
        )  # یک همکار به طور پیش‌فرض ایجاد شده است
        assert isinstance(item_production, ItemProduction)

    def test_str_method(self):
        recipe = RecipeFactory(name="Test Recipe")
        item_production = ItemProductionFactory(used_recipe=recipe)

        assert str(item_production) == "Test Recipe"

    def test_create_item_production_with_notes(self):
        item_production = ItemProductionFactory(notes="Test note")

        assert item_production.notes == "Test note"

    def test_item_production_calculation(self):
        used_quantity = Decimal("10.00")
        produced_quantity = Decimal("5.00")
        item_production = ItemProductionFactory(
            used_quantity=used_quantity, produced_quantity=produced_quantity
        )

        assert item_production.used_quantity == Decimal("10.00")
        assert item_production.produced_quantity == Decimal("5.00")

    def test_create_item_production_without_notes(self):
        item_production = ItemProductionFactory(notes=None)

        assert item_production.notes is None

    def test_item_production_cooperators(self):
        m1 = "09123456789"
        m2 = "09123456788"
        user1 = AccountFactory(mobile=m1)
        user2 = AccountFactory(mobile=m2)
        item_production = ItemProductionFactory(cooperators=[user1, user2])

        assert item_production.cooperators.count() == 2
        assert item_production.cooperators.first().mobile in (m1, m2)
        assert item_production.cooperators.last().mobile in (m1, m2)

    def test_create_multiple_item_productions(self):
        item_productions = ItemProductionFactory.create_batch(5)

        assert len(item_productions) == 5
        for item_production in item_productions:
            assert isinstance(item_production, ItemProduction)
            assert item_production.used_recipe is not None
