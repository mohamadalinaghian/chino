from decimal import Decimal

import factory
from apps.sale.models import SaleItem


class SaleItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SaleItem

    sale = factory.SubFactory("apps.sale.tests.factories.SaleFactory")
    product = factory.SubFactory("apps.inventory.tests.factories.ProductFactory")
    quantity = Decimal("1")
    unit_price = Decimal("100")
    material_cost = Decimal("50")
