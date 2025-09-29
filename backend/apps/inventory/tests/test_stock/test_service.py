from decimal import Decimal

import pytest
from apps.inventory.exceptions import InsufficientStockError
from apps.inventory.models import Stock
from apps.inventory.services.stock import StockService
from apps.inventory.tests.factories import ProductFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestStockService:
    def test_add_purchase_to_stock_creates_record(self):
        product = ProductFactory(is_stock_traceable=True)
        stock = StockService.add_to_stock(
            product=product, unit_price=Decimal("5.00"), quantity=Decimal("20.00")
        )
        assert stock.stored_product == product
        assert stock.unit_price == Decimal("5.00")
        assert stock.remaining_quantity == Decimal("20.00")

    def test_add_production_to_stock_creates_record(self):
        product = ProductFactory(is_stock_traceable=True)
        stock = StockService.add_to_stock(
            product=product, unit_price=Decimal("7.00"), quantity=Decimal("50.00")
        )
        assert stock.stored_product == product
        assert stock.unit_price == Decimal("7.00")
        assert stock.remaining_quantity == Decimal("50.00")

    def test_add_purchase_to_stock_rejects_non_traceable(self):
        product = ProductFactory(is_stock_traceable=False)
        with pytest.raises(ValidationError):
            StockService.add_to_stock(
                product=product, unit_price=Decimal("5.00"), quantity=Decimal("20.00")
            )

    def test_reserve_fifo_succeeds_with_sufficient_stock(self):
        product = ProductFactory(is_stock_traceable=True)

        StockService.add_to_stock(
            product=product, unit_price=Decimal("5.00"), quantity=Decimal("100.00")
        )

        total_cost = StockService.reserve_fifo(product, Decimal("50.00"))
        assert total_cost == Decimal("250.00")  # 50 * 5.00 قیمت واحد
        stock = Stock.objects.get(stored_product=product)
        assert stock.remaining_quantity == Decimal("50.00")

    def test_reserve_fifo_fails_with_insufficient_stock(self):
        product = ProductFactory(is_stock_traceable=True)

        StockService.add_to_stock(
            product=product, unit_price=Decimal("5.00"), quantity=Decimal("10.00")
        )

        with pytest.raises(InsufficientStockError):
            StockService.reserve_fifo(product.id, Decimal("20.00"))

    def test_reserve_fifo_rejects_negative_quantity(self):
        product = ProductFactory(is_stock_traceable=True)
        StockService.add_to_stock(
            product=product, unit_price=Decimal("5.00"), quantity=Decimal("50.00")
        )
        with pytest.raises(ValidationError):
            StockService.reserve_fifo(product, Decimal("-10.00"))

    def test_reserve_fifo_rejects_zero_quantity(self):
        product = ProductFactory(is_stock_traceable=True)
        StockService.add_to_stock(
            product=product, unit_price=Decimal("5.00"), quantity=Decimal("50.00")
        )
        with pytest.raises(ValidationError):
            StockService.reserve_fifo(product, Decimal("0.00"))
