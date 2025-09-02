from decimal import Decimal

import pytest
from apps.inventory.services.product import ProductService
from apps.inventory.tests.factories.product import ProductFactory

ZERO = Decimal("0")


@pytest.mark.django_db
class TestProductService:

    def test_update_last_price(self):
        p = ProductFactory(last_purchased_price=ZERO)

        new_p = Decimal("2233.43")
        ProductService.update_last_price(p, new_p)

        p.refresh_from_db()
        assert p.last_purchased_price == new_p

    def test_deactivate_prod(self):
        p = ProductFactory()
        ProductService.deactivate_product(p.pk)

        p.refresh_from_db()

        assert p.is_active is False
