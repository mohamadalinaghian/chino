from decimal import Decimal

import factory
from apps.inventory.models import Product
from apps.inventory.tests.factories import ProductFactory
from apps.sale.models import SaleItem
from apps.sale.tests.factories import SaleInvoiceFactory


class SaleItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SaleItem

    sale_invoice = factory.SubFactory(SaleInvoiceFactory)
    product = factory.SubFactory(ProductFactory, type=Product.ProductType.SELLABLE)
    quantity = Decimal("1.000")
    sold_unit_price = Decimal("100.0000")
    discount_amount = None
