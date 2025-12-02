"""
Tests for SaleInvoiceService.

Covers:
- Order creation with stock consumption
- Order modification (add/remove/update items)
- Total calculations
- Status transitions
- Cancellation and refunds
- Query helpers

IMPORTANT: Products must be added to stock before creating sale items.
"""

from decimal import Decimal

import pytest
from apps.inventory.models import Product, Stock
from apps.inventory.services import StockService
from apps.inventory.tests.factories import ProductFactory
from apps.sale.models import SaleInvoice, SaleItem
from apps.sale.services.sale_invoice import SaleInvoiceService
from apps.user.tests.factories import AccountFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestSaleInvoiceService:
    """Test suite for SaleInvoiceService."""

    def setup_method(self):
        """Set up test data with products in stock."""
        self.staff = AccountFactory(is_staff=True)
        self.customer = AccountFactory(is_staff=False)

        # Create sellable products
        self.product1 = ProductFactory(
            type=Product.ProductType.SELLABLE,
            is_active=True,
            is_stock_traceable=True,
        )
        self.product2 = ProductFactory(
            type=Product.ProductType.SELLABLE,
            is_active=True,
            is_stock_traceable=True,
        )

        # Add stock for products
        self.stock1 = StockService.add_to_stock(
            product=self.product1,
            unit_price=Decimal("5000"),
            quantity=Decimal("100.000"),
        )
        self.stock2 = StockService.add_to_stock(
            product=self.product2,
            unit_price=Decimal("3000"),
            quantity=Decimal("100.000"),
        )

    def test_create_order_with_single_item(self):
        """Test creating a basic order with one item."""
        items = [
            {
                "product": self.product1,
                "quantity": Decimal("5.000"),
                "unit_price": Decimal("10000.0000"),
                "discount_amount": Decimal("0"),
                "sale_method": SaleItem.SaleType.STOCK,
            }
        ]

        invoice = SaleInvoiceService.create_order(
            staff=self.staff,
            items=items,
            customer=self.customer,
            note="Test order",
        )

        # Verify invoice was created
        assert invoice.pk is not None
        assert invoice.staff == self.staff
        assert invoice.customer == self.customer
        assert invoice.bill_status == SaleInvoice.BillStatus.OPEN

        # Verify item was created
        assert invoice.items.count() == 1
        item = invoice.items.first()
        assert item.product == self.product1
        assert item.quantity == Decimal("5.000")
        assert item.unit_price == Decimal("10000.0000")

        # Verify total was calculated
        expected_total = Decimal("50000.0000")  # 5 * 10000
        assert invoice.cached_total_amount == expected_total

        # Verify stock was consumed
        stock = Stock.objects.get_total(self.product1)
        assert stock == Decimal("95.000")  # 100 - 5

    def test_create_order_with_multiple_items(self):
        """Test creating an order with multiple items."""
        items = [
            {
                "product": self.product1,
                "quantity": Decimal("3.000"),
                "unit_price": Decimal("10000.0000"),
                "discount_amount": Decimal("0"),
                "sale_method": SaleItem.SaleType.STOCK,
            },
            {
                "product": self.product2,
                "quantity": Decimal("2.000"),
                "unit_price": Decimal("8000.0000"),
                "discount_amount": Decimal("0"),
                "sale_method": SaleItem.SaleType.STOCK,
            },
        ]

        invoice = SaleInvoiceService.create_order(
            staff=self.staff,
            items=items,
        )

        # Verify both items were created
        assert invoice.items.count() == 2

        # Verify total was calculated correctly
        expected_total = Decimal("46000.0000")  # (3 * 10000) + (2 * 8000)
        assert invoice.cached_total_amount == expected_total

        # Verify stock was consumed for both products
        assert Stock.objects.get_total(self.product1) == Decimal("97.000")
        assert Stock.objects.get_total(self.product2) == Decimal("98.000")

    def test_create_order_with_discount(self):
        """Test creating an order with discounted items."""
        items = [
            {
                "product": self.product1,
                "quantity": Decimal("5.000"),
                "unit_price": Decimal("10000.0000"),
                "discount_amount": Decimal("5000.0000"),
                "sale_method": SaleItem.SaleType.STOCK,
            }
        ]

        invoice = SaleInvoiceService.create_order(
            staff=self.staff,
            items=items,
        )

        # Verify discount was applied
        expected_total = Decimal("45000.0000")  # (5 * 10000) - 5000
        assert invoice.cached_total_amount == expected_total

    def test_create_order_requires_staff(self):
        """Test that only staff users can create orders."""
        non_staff = AccountFactory(is_staff=False)

        items = [
            {
                "product": self.product1,
                "quantity": Decimal("1.000"),
                "unit_price": Decimal("10000.0000"),
                "discount_amount": Decimal("0"),
                "sale_method": SaleItem.SaleType.STOCK,
            }
        ]

        with pytest.raises(ValidationError) as cm:
            SaleInvoiceService.create_order(
                staff=non_staff,
                items=items,
            )

        assert "staff" in str(cm.value).lower()

    def test_create_order_insufficient_stock(self):
        """Test that order fails when insufficient stock."""
        items = [
            {
                "product": self.product1,
                "quantity": Decimal("150.000"),  # More than available
                "unit_price": Decimal("10000.0000"),
                "discount_amount": Decimal("0"),
                "sale_method": SaleItem.SaleType.STOCK,
            }
        ]

        with pytest.raises(ValidationError) as cm:
            SaleInvoiceService.create_order(
                staff=self.staff,
                items=items,
            )

        assert "stock" in str(cm.value).lower()

    # ... Continue converting all other test methods similarly
