# apps/sale/tests/test_services/test_sale_item_service.py
"""
Tests for SaleItemService.

Covers:
- Product validation
- Stock consumption (STOCK method)
- Phantom production (PHANTOM method)
- COGS calculation
- Profit calculations
- Margin calculations

IMPORTANT: Add products to stock before testing STOCK method.
Create recipes for products before testing PHANTOM method.
"""

from decimal import Decimal

import pytest
from apps.inventory.models import Product, Stock
from apps.inventory.services import StockService
from apps.inventory.tests.factories import (
    ProductFactory,
    RecipeComponentFactory,
    RecipeFactory,
)
from apps.sale.models import SaleItem
from apps.sale.services.sale_item import SaleItemService
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestSaleItemService:
    """Test suite for SaleItemService."""

    def setup_method(self):
        """Set up test data with products and stock."""
        # Create sellable product
        self.product = ProductFactory(
            type=Product.ProductType.SELLABLE,
            is_active=True,
            is_stock_traceable=True,
        )

        # Add stock
        StockService.add_to_stock(
            product=self.product,
            unit_price=Decimal("5000.0000"),
            quantity=Decimal("100.000"),
        )

    def test_validate_saleable_product(self):
        """Test that sellable products pass validation."""
        # Should not raise exception
        SaleItemService.validate_saleable(self.product)

    def test_validate_inactive_product_fails(self):
        """Test that inactive products fail validation."""
        inactive_product = ProductFactory(
            type=Product.ProductType.SELLABLE,
            is_active=False,
        )

        with pytest.raises(ValidationError) as cm:
            SaleItemService.validate_saleable(inactive_product)

        assert "not active" in str(cm.value).lower()

    def test_validate_non_sellable_type_fails(self):
        """Test that non-sellable product types fail validation."""
        raw_product = ProductFactory(
            type=Product.ProductType.RAW,
            is_active=True,
        )

        with pytest.raises(ValidationError) as cm:
            SaleItemService.validate_saleable(raw_product)

        assert "not sellable" in str(cm.value).lower()

    def test_consume_stock_method(self):
        """Test consuming stock using STOCK sale method."""
        quantity = Decimal("10.000")
        stock_before = Stock.objects.get_total(self.product)

        # Consume stock
        cost = SaleItemService.consume_and_calculate_cost(
            product=self.product,
            quantity=quantity,
            sale_method=SaleItem.SaleType.STOCK,
        )

        # Verify cost was calculated
        assert cost > Decimal("0")
        expected_cost = Decimal("5000.0000") * quantity
        assert cost == expected_cost

        # Verify stock was consumed
        stock_after = Stock.objects.get_total(self.product)
        assert stock_after == stock_before - quantity

    def test_insufficient_stock_raises_error(self):
        """Test that consuming more stock than available raises error."""
        quantity = Decimal("150.000")  # More than available (100)

        with pytest.raises(ValidationError) as cm:
            SaleItemService.consume_and_calculate_cost(
                product=self.product,
                quantity=quantity,
                sale_method=SaleItem.SaleType.STOCK,
            )

        assert "not enough stock" in str(cm.value).lower()

    def test_zero_quantity_validation(self):
        """Test that zero quantity raises validation error."""
        with pytest.raises(ValidationError) as cm:
            SaleItemService.consume_and_calculate_cost(
                product=self.product,
                quantity=Decimal("0"),
                sale_method=SaleItem.SaleType.STOCK,
            )

        assert "positive" in str(cm.value).lower()

    def test_negative_quantity_validation(self):
        """Test that negative quantity raises validation error."""
        with pytest.raises(ValidationError) as cm:
            SaleItemService.consume_and_calculate_cost(
                product=self.product,
                quantity=Decimal("-5.000"),
                sale_method=SaleItem.SaleType.STOCK,
            )

        assert "positive" in str(cm.value).lower()

    def test_phantom_requires_recipe(self):
        """Test that PHANTOM method requires an active recipe."""
        phantom_product = ProductFactory(
            type=Product.ProductType.SELLABLE,
            is_active=True,
            is_stock_traceable=False,
        )

        # No recipe exists
        with pytest.raises(ValidationError) as cm:
            SaleItemService.consume_and_calculate_cost(
                product=phantom_product,
                quantity=Decimal("1.000"),
                sale_method=SaleItem.SaleType.PHANTOM,
            )

        assert "no active recipe" in str(cm.value).lower()

    def test_phantom_method_with_recipe(self):
        """Test PHANTOM method with valid recipe."""
        # Create phantom product
        phantom_product = ProductFactory(
            type=Product.ProductType.SELLABLE,
            is_active=True,
            is_stock_traceable=False,
        )

        # Create ingredient with stock
        ingredient = ProductFactory(
            type=Product.ProductType.RAW,
            is_active=True,
            is_stock_traceable=True,
        )
        StockService.add_to_stock(
            product=ingredient,
            unit_price=Decimal("1000.0000"),
            quantity=Decimal("100.000"),
        )

        # Create recipe
        recipe = RecipeFactory(produced_product=phantom_product)
        RecipeComponentFactory(
            recipe=recipe,
            consume_product=ingredient,
            quantity=Decimal("0.5"),  # 50% of final product
        )
        phantom_product.active_recipe = recipe

        # Consume phantom
        cost = SaleItemService.consume_and_calculate_cost(
            product=phantom_product,
            quantity=Decimal("10.000"),
            sale_method=SaleItem.SaleType.PHANTOM,
        )

        # Verify cost was calculated from ingredients
        assert cost > Decimal("0")

        # Verify ingredient stock was consumed
        ingredient_stock = Stock.objects.get_total(ingredient)
        assert ingredient_stock < Decimal("100.000")

    def test_invalid_sale_method_raises_error(self):
        """Test that invalid sale method raises error."""
        with pytest.raises(ValidationError) as cm:
            SaleItemService.consume_and_calculate_cost(
                product=self.product,
                quantity=Decimal("1.000"),
                sale_method="INVALID",
            )

        assert "invalid sale method" in str(cm.value).lower()

    def test_calculate_item_profit(self):
        """Test calculating profit for an item."""
        unit_price = Decimal("10000.0000")
        quantity = Decimal("5.000")
        discount = Decimal("1000.0000")
        material_cost = Decimal("20000.0000")

        profit = SaleItemService.calculate_item_profit(
            unit_price=unit_price,
            quantity=quantity,
            discount=discount,
            material_cost=material_cost,
        )

        expected_profit = Decimal("29000.0000")
        assert profit == expected_profit

    def test_calculate_item_profit_with_zero_discount(self):
        """Test profit calculation with no discount."""
        profit = SaleItemService.calculate_item_profit(
            unit_price=Decimal("10000.0000"),
            quantity=Decimal("3.000"),
            discount=Decimal("0"),
            material_cost=Decimal("15000.0000"),
        )

        assert profit == Decimal("15000.0000")

    def test_calculate_negative_profit(self):
        """Test that negative profit (loss) is calculated correctly."""
        profit = SaleItemService.calculate_item_profit(
            unit_price=Decimal("10000.0000"),
            quantity=Decimal("2.000"),
            discount=Decimal("0"),
            material_cost=Decimal("25000.0000"),
        )

        assert profit == Decimal("-5000.0000")

    def test_calculate_margin_percentage(self):
        """Test calculating profit margin as percentage."""
        margin = SaleItemService.calculate_margin_percentage(
            unit_price=Decimal("10000.0000"),
            quantity=Decimal("5.000"),
            discount=Decimal("0"),
            material_cost=Decimal("25000.0000"),
        )

        assert margin == Decimal("50.00")

    def test_calculate_margin_with_discount(self):
        """Test margin calculation with discount applied."""
        margin = SaleItemService.calculate_margin_percentage(
            unit_price=Decimal("10000.0000"),
            quantity=Decimal("5.000"),
            discount=Decimal("5000.0000"),
            material_cost=Decimal("20000.0000"),
        )

        assert round(float(margin), 2) == 55.56

    def test_calculate_margin_zero_revenue(self):
        """Test that zero revenue returns zero margin."""
        margin = SaleItemService.calculate_margin_percentage(
            unit_price=Decimal("10000.0000"),
            quantity=Decimal("1.000"),
            discount=Decimal("10000.0000"),  # Discount = Revenue
            material_cost=Decimal("5000.0000"),
        )

        assert margin == Decimal("0")

    def test_calculate_negative_margin(self):
        """Test calculating negative margin (selling at loss)."""
        margin = SaleItemService.calculate_margin_percentage(
            unit_price=Decimal("10000.0000"),
            quantity=Decimal("2.000"),
            discount=Decimal("0"),
            material_cost=Decimal("25000.0000"),
        )

        assert margin == Decimal("-25.00")

    def test_fifo_cost_calculation_multiple_lots(self):
        """Test that FIFO properly calculates cost from multiple stock lots."""
        # Add more stock at different prices
        StockService.add_to_stock(
            product=self.product,
            unit_price=Decimal("6000.0000"),
            quantity=Decimal("50.000"),
        )

        quantity = Decimal("110.000")  # Uses first lot 100 + 10 from second

        cost = SaleItemService.consume_and_calculate_cost(
            product=self.product,
            quantity=quantity,
            sale_method=SaleItem.SaleType.STOCK,
        )

        expected_cost = Decimal("560000.0000")
        assert cost == expected_cost

    def test_stock_consumption_is_atomic(self):
        """Test that failed consumption doesn't affect stock."""
        quantity = Decimal("10.000")
        stock_before = Stock.objects.get_total(self.product)

        # First valid consumption
        try:
            SaleItemService.consume_and_calculate_cost(
                product=self.product,
                quantity=quantity,
                sale_method=SaleItem.SaleType.STOCK,
            )
        except Exception:
            pass

        stock_after = Stock.objects.get_total(self.product)
        assert stock_after == stock_before - quantity

        # Failed consumption (too much)
        try:
            SaleItemService.consume_and_calculate_cost(
                product=self.product,
                quantity=Decimal("200.000"),
                sale_method=SaleItem.SaleType.STOCK,
            )
        except ValidationError:
            pass

        stock_final = Stock.objects.get_total(self.product)
        assert stock_final == stock_after
