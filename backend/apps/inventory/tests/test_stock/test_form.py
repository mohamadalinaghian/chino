from decimal import Decimal

import pytest
from apps.inventory.forms import StockForm
from apps.inventory.tests.factories import ProductFactory


@pytest.mark.django_db
class TestStockForm:
    def test_valid_form_creates_stock(self):
        product = ProductFactory()
        form = StockForm(
            data={
                "stored_product": product.id,
                "initial_quantity": "10.00",
                "remaining_quantity": "10.00",
                "unit_price": "5.50",
                "create_at": "2025-01-01",
            }
        )
        assert form.is_valid(), form.errors
        obj = form.save()
        assert obj.stored_product == product
        assert obj.unit_price == Decimal("5.50")

    def test_invalid_when_remaining_greater_than_initial(self):
        product = ProductFactory()
        form = StockForm(
            data={
                "stored_product": product.id,
                "initial_quantity": "5.00",
                "remaining_quantity": "10.00",
                "unit_price": "2.00",
                "create_at": "2025-01-01",
            }
        )
        # Currently model/form has no validation for this,
        # but if you later add clean() logic this test ensures it's caught
        assert not form.is_valid()
