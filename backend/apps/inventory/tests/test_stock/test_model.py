from decimal import Decimal

import pytest
from apps.inventory.tests.factories import StockFactory


@pytest.mark.django_db
class TestStock:
    def test_create_stock(self):
        obj = StockFactory(
            initial_quantity=Decimal("10"), remaining_quantity=Decimal("10")
        )
        assert obj.id is not None
        assert str(obj) == f"{obj.stored_product}: {obj.create_at}"

    def test_remaining_quantity_can_be_less_than_initial(self):
        obj = StockFactory(
            initial_quantity=Decimal("10"), remaining_quantity=Decimal("5")
        )
        assert obj.remaining_quantity < obj.initial_quantity
