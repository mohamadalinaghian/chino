"""
Tests for SaleItem model.

Covers:
- Model creation and validation
- Relationships with invoice and product
- Sale methods (STOCK vs PHANTOM)
- Pricing and discount calculations
- COGS tracking
- Unique constraints
"""

from decimal import Decimal

import pytest
from apps.inventory.models import Product
from apps.inventory.tests.factories import ProductFactory
from apps.sale.models import SaleItem
from apps.sale.tests.factories import (
    DiscountedSaleItemFactory,
    PhantomSaleItemFactory,
    SaleInvoiceFactory,
    SaleItemFactory,
)
from apps.user.tests.factories import AccountFactory
from django.db import IntegrityError


@pytest.mark.django_db
class TestSaleItemModel:
    """Pytest test suite for SaleItem model."""

    def test_create_sale_item_with_all_fields(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item = SaleItemFactory(
            sale_invoice=invoice,
            product=product,
            quantity=Decimal("3.000"),
            unit_price=Decimal("15000.0000"),
            discount_amount=Decimal("1000.0000"),
            material_cost=Decimal("12000.0000"),
            sale_method=SaleItem.SaleType.STOCK,
        )

        assert item.sale_invoice == invoice
        assert item.product == product
        assert item.quantity == Decimal("3.000")
        assert item.unit_price == Decimal("15000.0000")
        assert item.discount_amount == Decimal("1000.0000")
        assert item.material_cost == Decimal("12000.0000")
        assert item.sale_method == SaleItem.SaleType.STOCK

    def test_sale_item_default_discount_is_zero(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item = SaleItem.objects.create(
            sale_invoice=invoice,
            product=product,
            quantity=Decimal("1.000"),
            unit_price=Decimal("10000.0000"),
        )

        assert item.discount_amount == Decimal("0")

    def test_sale_item_default_material_cost_is_zero(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item = SaleItem.objects.create(
            sale_invoice=invoice,
            product=product,
            quantity=Decimal("1.000"),
            unit_price=Decimal("10000.0000"),
        )

        assert item.material_cost == Decimal("0")

    def test_sale_item_default_sale_method_is_stock(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item = SaleItem.objects.create(
            sale_invoice=invoice,
            product=product,
            quantity=Decimal("1.000"),
            unit_price=Decimal("10000.0000"),
        )

        assert item.sale_method == SaleItem.SaleType.STOCK

    def test_sale_item_default_stock_consumed_is_true(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item = SaleItem.objects.create(
            sale_invoice=invoice,
            product=product,
            quantity=Decimal("1.000"),
            unit_price=Decimal("10000.0000"),
        )

        assert item.stock_consumed

    def test_sale_item_sale_method_choices(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        stock_item = SaleItemFactory(
            sale_invoice=invoice,
            product=product,
            sale_method=SaleItem.SaleType.STOCK,
        )
        assert stock_item.sale_method == SaleItem.SaleType.STOCK

        phantom_item = PhantomSaleItemFactory(sale_invoice=invoice)
        assert phantom_item.sale_method == SaleItem.SaleType.PHANTOM

    def test_sale_item_decimal_precision(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item = SaleItemFactory(
            sale_invoice=invoice,
            product=product,
            quantity=Decimal("12.345"),
            unit_price=Decimal("12345.6789"),
            discount_amount=Decimal("500.1234"),
            material_cost=Decimal("8000.5678"),
        )

        item.refresh_from_db()
        assert item.quantity == Decimal("12.345")
        assert item.unit_price == Decimal("12345.6789")
        assert item.discount_amount == Decimal("500.1234")
        assert item.material_cost == Decimal("8000.5678")

    def test_sale_item_relationship_with_invoice(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item = SaleItemFactory(
            sale_invoice=invoice,
            product=product,
        )

        # Forward relationship
        assert item.sale_invoice == invoice
        # Reverse relationship
        assert item in invoice.items.all()

    def test_sale_item_relationship_with_product(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item = SaleItemFactory(
            sale_invoice=invoice,
            product=product,
        )

        # Forward relationship
        assert item.product == product
        # Reverse relationship
        assert item in product.sale_items.all()

    def test_sale_item_cascade_delete_with_invoice(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item = SaleItemFactory(
            sale_invoice=invoice,
            product=product,
        )
        pk = item.pk

        invoice.delete()
        assert not SaleItem.objects.filter(pk=pk).exists()

    def test_sale_item_protect_product_on_delete(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item = SaleItemFactory(
            sale_invoice=invoice,
            product=product,
        )

        with pytest.raises(Exception):  # Django's ProtectedError
            product.delete()

        assert SaleItem.objects.filter(pk=item.pk).exists()

    def test_sale_item_unique_constraint_product_per_invoice(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        SaleItemFactory(sale_invoice=invoice, product=product)

        with pytest.raises(IntegrityError):
            SaleItemFactory(sale_invoice=invoice, product=product)

    def test_sale_item_same_product_different_invoices(self):
        staff = AccountFactory(is_staff=True)
        invoice1 = SaleInvoiceFactory(staff=staff)
        invoice2 = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item1 = SaleItemFactory(sale_invoice=invoice1, product=product)
        item2 = SaleItemFactory(sale_invoice=invoice2, product=product)

        assert item1.pk is not None
        assert item2.pk is not None
        assert item1.pk != item2.pk

    def test_discounted_sale_item_factory(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item = DiscountedSaleItemFactory(
            sale_invoice=invoice,
            product=product,
            quantity=Decimal("2.000"),
            unit_price=Decimal("10000.0000"),
        )

        expected_discount = Decimal("2000.0000")  # 10% of 20000
        assert item.discount_amount == expected_discount

    def test_sale_item_str_method(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item = SaleItemFactory(
            sale_invoice=invoice, product=product, quantity=Decimal("3.000")
        )
        str_repr = str(item)
        assert str(product) in str_repr
        assert "3" in str_repr

    def test_sale_item_ordering(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product1 = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)
        product2 = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item1 = SaleItemFactory(sale_invoice=invoice, product=product1)
        item2 = SaleItemFactory(sale_invoice=invoice, product=product2)

        items = invoice.items.all()
        assert items[0] == item1
        assert items[1] == item2

    def test_sale_item_timestamps(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)
        product = ProductFactory(type=Product.ProductType.SELLABLE, is_active=True)

        item = SaleItemFactory(sale_invoice=invoice, product=product)
        assert item.created_at is not None
        assert item.updated_at is not None

        original_updated_at = item.updated_at
        item.quantity = Decimal("5.000")
        item.save()
        assert item.updated_at > original_updated_at
