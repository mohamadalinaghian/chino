from decimal import Decimal

import pytest
from apps.inventory.models import Product
from apps.inventory.tests.factories import ProductFactory
from apps.sale.models import SaleInvoice, SaleItem
from apps.sale.tests.factories.sale_invoice import SaleInvoiceFactory
from apps.sale.tests.factories.sale_item import SaleItemFactory
from django.db import IntegrityError, transaction


@pytest.mark.django_db
class TestSaleItemModel:
    def test_create_valid_sale_item_default_factory(self):
        # Happy path: Default SaleItemFactory creates valid instance
        sale_item = SaleItemFactory()
        assert sale_item.pk is not None
        assert isinstance(sale_item.sale_invoice, SaleInvoice)
        assert sale_item.product.type == Product.ProductType.SELLABLE
        assert sale_item.quantity == Decimal("1.000")
        assert sale_item.sold_unit_price == Decimal("100.0000")
        assert sale_item.discount_amount is None
        assert sale_item.total_cost == Decimal("100.000")  # 1.000 * 100.0000
        assert str(sale_item) == f"{sale_item.product}: {sale_item.sale_invoice}"

    def test_create_sale_item_with_custom_values(self):
        # Happy path: Override factory fields
        product = ProductFactory(type=Product.ProductType.SELLABLE)
        invoice = SaleInvoiceFactory()
        sale_item = SaleItemFactory(
            sale_invoice=invoice,
            product=product,
            quantity=Decimal("2.500"),
            sold_unit_price=Decimal("150.7500"),
            discount_amount=Decimal("20.0000"),
        )
        assert sale_item.sale_invoice == invoice
        assert sale_item.product == product
        assert sale_item.quantity == Decimal("2.500")
        assert sale_item.sold_unit_price == Decimal("150.7500")
        assert sale_item.discount_amount == Decimal("20.0000")
        assert sale_item.total_cost == Decimal("376.875")  # 2.500 * 150.7500

    def test_total_cost_property(self):
        # Happy path: total_cost calculation
        sale_item = SaleItemFactory(
            quantity=Decimal("3.000"), sold_unit_price=Decimal("50.0000")
        )
        assert sale_item.total_cost == Decimal("150.000")  # 3.000 * 50.0000

    def test_total_cost_ignores_discount(self):
        # Edge case: discount_amount does not affect total_cost
        sale_item = SaleItemFactory(
            quantity=Decimal("1.000"),
            sold_unit_price=Decimal("100.0000"),
            discount_amount=Decimal("10.0000"),
        )
        assert sale_item.total_cost == Decimal("100.000")  # Still 1.000 * 100.0000

    def test_unique_constraint_enforced(self):
        # Bad path: Violate unique constraint on (sale_invoice, product)
        sale_item1 = SaleItemFactory()
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                SaleItemFactory(
                    sale_invoice=sale_item1.sale_invoice, product=sale_item1.product
                )

    def test_unique_constraint_allows_different_invoice(self):
        # Happy path: Same product, different invoice
        product = ProductFactory(type=Product.ProductType.SELLABLE)
        invoice1 = SaleInvoiceFactory()
        invoice2 = SaleInvoiceFactory()
        sale_item1 = SaleItemFactory(sale_invoice=invoice1, product=product)
        sale_item2 = SaleItemFactory(sale_invoice=invoice2, product=product)
        assert sale_item1.pk != sale_item2.pk

    def test_unique_constraint_allows_different_product(self):
        # Happy path: Same invoice, different product
        invoice = SaleInvoiceFactory()
        product1 = ProductFactory(type=Product.ProductType.SELLABLE)
        product2 = ProductFactory(type=Product.ProductType.SELLABLE)
        sale_item1 = SaleItemFactory(sale_invoice=invoice, product=product1)
        sale_item2 = SaleItemFactory(sale_invoice=invoice, product=product2)
        assert sale_item1.pk != sale_item2.pk

    def test_non_sellable_product_allowed(self):
        # Edge case: SaleItem allows non-SELLABLE products (no validation in model)
        product = ProductFactory(type=Product.ProductType.RAW)
        sale_item = SaleItemFactory(product=product)
        assert sale_item.product.type == Product.ProductType.RAW

    def test_null_sale_invoice_disallowed(self):
        # Bad path: sale_invoice is required
        with pytest.raises(IntegrityError):
            SaleItemFactory(sale_invoice=None)

    def test_null_product_disallowed(self):
        # Bad path: product is required
        with pytest.raises(IntegrityError):
            SaleItemFactory(product=None)

    def test_max_quantity_value(self):
        # Edge case: Maximum quantity (10 digits, 3 decimal places)
        max_qty = Decimal("9999999.999")
        sale_item = SaleItemFactory(quantity=max_qty)
        assert sale_item.quantity == max_qty

    def test_min_positive_quantity(self):
        # Edge case: Smallest positive quantity
        min_qty = Decimal("0.001")
        sale_item = SaleItemFactory(quantity=min_qty)
        assert sale_item.quantity == min_qty

    def test_zero_quantity_allowed(self):
        # Edge case: Zero quantity (no model validation)
        sale_item = SaleItemFactory(quantity=Decimal("0.000"))
        assert sale_item.quantity == Decimal("0.000")
        assert sale_item.total_cost == Decimal("0.000")

    def test_negative_quantity_allowed(self):
        # Edge case: Negative quantity (no model validation)
        sale_item = SaleItemFactory(quantity=Decimal("-1.000"))
        assert sale_item.quantity == Decimal("-1.000")
        assert sale_item.total_cost == Decimal("-100.0000")  # -1.000 * 100.0000

    def test_max_sold_unit_price(self):
        # Edge case: Maximum sold_unit_price
        max_price = Decimal("999999.9999")
        sale_item = SaleItemFactory(sold_unit_price=max_price)
        assert sale_item.sold_unit_price == max_price

    def test_min_positive_sold_unit_price(self):
        # Edge case: Smallest positive sold_unit_price
        min_price = Decimal("0.0001")
        sale_item = SaleItemFactory(sold_unit_price=min_price)
        assert sale_item.sold_unit_price == min_price

    def test_zero_sold_unit_price_allowed(self):
        # Edge case: Zero sold_unit_price
        sale_item = SaleItemFactory(sold_unit_price=Decimal("0.0000"))
        assert sale_item.sold_unit_price == Decimal("0.0000")
        assert sale_item.total_cost == Decimal("0.000")

    def test_negative_sold_unit_price_allowed(self):
        # Edge case: Negative sold_unit_price
        sale_item = SaleItemFactory(sold_unit_price=Decimal("-50.0000"))
        assert sale_item.sold_unit_price == Decimal("-50.0000")
        assert sale_item.total_cost == Decimal("-50.000")  # 1.000 * -50.0000

    def test_discount_amount_null(self):
        # Happy path: discount_amount can be None
        sale_item = SaleItemFactory(discount_amount=None)
        assert sale_item.discount_amount is None

    def test_discount_amount_positive(self):
        # Happy path: Positive discount_amount
        sale_item = SaleItemFactory(discount_amount=Decimal("15.5000"))
        assert sale_item.discount_amount == Decimal("15.5000")

    def test_discount_amount_zero(self):
        # Edge case: Zero discount_amount
        sale_item = SaleItemFactory(discount_amount=Decimal("0.0000"))
        assert sale_item.discount_amount == Decimal("0.0000")

    def test_discount_amount_negative_allowed(self):
        # Edge case: Negative discount_amount (no validation)
        sale_item = SaleItemFactory(discount_amount=Decimal("-5.0000"))
        assert sale_item.discount_amount == Decimal("-5.0000")

    def test_str_method(self):
        # Happy path: __str__ returns product and invoice
        sale_item = SaleItemFactory()
        expected = f"{sale_item.product}: {sale_item.sale_invoice}"
        assert str(sale_item) == expected

    def test_sale_method_enum(self):
        # Test: SaleMethod choices (fix: account for translation)
        assert SaleItem.SaleMethod.PHANTOM == "PHANTOM"
        assert SaleItem.SaleMethod.STOCK == "STOCK"
        assert SaleItem.SaleMethod.choices == [
            ("PHANTOM", "Phantom"),
            ("STOCK", "انبار"),  # Use translated label
        ]

    def test_meta_ordering(self):
        # Test: Meta ordering by sale_invoice (fix: expect tuple)
        invoice1 = SaleInvoiceFactory()
        invoice2 = SaleInvoiceFactory()
        SaleItemFactory(sale_invoice=invoice1)
        SaleItemFactory(sale_invoice=invoice2)
        assert SaleItem._meta.ordering == ("sale_invoice",)

    def test_meta_constraints(self):
        # Test: Unique constraint exists
        constraints = [c.name for c in SaleItem._meta.constraints]
        assert "uq_sale_item" in constraints
