from decimal import Decimal

import pytest
from apps.inventory.services.stock import StockService
from apps.inventory.tests.factories import ProductFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestStockService:
    def test_add_purchase_to_stock_creates_record(self):
        product = ProductFactory(is_stock_traceable=True)
        stock = StockService.add_purchase_to_stock(
            product=product,
            unit_price=Decimal("5.00"),
            quantity=Decimal("20.00"),
        )
        assert stock.stored_product == product
        assert stock.unit_price == Decimal("5.00")
        assert stock.remaining_quantity == Decimal("20.00")

    def test_add_purchase_to_stock_rejects_non_traceable(self):
        product = ProductFactory(is_stock_traceable=False)
        with pytest.raises(ValidationError):
            StockService.add_purchase_to_stock(
                product=product,
                unit_price=Decimal("5.00"),
                quantity=Decimal("20.00"),
            )
