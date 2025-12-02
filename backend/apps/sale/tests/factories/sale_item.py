# apps/sale/tests/factories/sale_item.py
"""
Factory for SaleItem model.

Generates test data for individual items in sale invoices.
Note: For testing with services, ensure products are added to stock first.
"""

from decimal import Decimal

import factory
from apps.inventory.models import Product
from apps.sale.models import SaleItem


class SaleItemFactory(factory.django.DjangoModelFactory):
    """
    Factory for creating SaleItem instances.

    Creates sale items with:
    - Sellable products
    - Realistic pricing and quantities
    - COGS tracking

    Important: When using with services, ensure the product has stock first:
        stock = StockService.add_to_stock(product, unit_price, quantity)
        sale_item = SaleItemFactory(product=product, ...)
    """

    class Meta:
        model = SaleItem

    sale_invoice = factory.SubFactory("apps.sale.tests.factories.SaleInvoiceFactory")
    product = factory.SubFactory(
        "apps.inventory.tests.factories.ProductFactory",
        type=Product.ProductType.SELLABLE,
        is_active=True,
        is_stock_traceable=True,
    )
    quantity = factory.Faker(
        "pydecimal",
        left_digits=2,
        right_digits=3,
        positive=True,
        min_value=1,
        max_value=50,
    )
    unit_price = factory.Faker(
        "pydecimal",
        left_digits=5,
        right_digits=4,
        positive=True,
        min_value=5000,
        max_value=100000,
    )
    discount_amount = Decimal("0")

    # Material cost is typically calculated by SaleItemService
    # but we provide a default for direct factory usage
    material_cost = factory.LazyAttribute(
        lambda obj: obj.unit_price * obj.quantity * Decimal("0.4")
    )

    sale_method = SaleItem.SaleType.STOCK
    stock_consumed = True


class PhantomSaleItemFactory(SaleItemFactory):
    """
    Factory for made-to-order items (phantom sales).

    These items are produced on-demand from recipes rather than from stock.
    The product must have an active recipe for this to work with services.
    """

    sale_method = SaleItem.SaleType.PHANTOM

    product = factory.SubFactory(
        "apps.inventory.tests.factories.ProductFactory",
        type=Product.ProductType.SELLABLE,
        is_active=True,
        is_stock_traceable=False,  # Phantom items don't track stock directly
    )


class DiscountedSaleItemFactory(SaleItemFactory):
    """
    Factory for items with discounts applied.

    Applies a 10% discount by default.
    """

    @factory.lazy_attribute
    def discount_amount(self):
        """Calculate 10% discount on total price."""
        return (self.unit_price * self.quantity) * Decimal("0.1")
