from datetime import date, timedelta

import pytest
from apps.inventory.models import ExpiryPurchaseItem
from apps.inventory.tests.factories import ExpiryPurchaseItemFactory


@pytest.mark.django_db
class TestExpiryPurchaseItemModel:
    def test_str_method(self):
        obj = ExpiryPurchaseItemFactory()
        assert str(obj) == f"{obj.purchased_item.purchased_product} {obj.expiry_date}"

    def test_ordering(self):
        older = ExpiryPurchaseItemFactory(expiry_date=date.today() + timedelta(days=5))
        newer = ExpiryPurchaseItemFactory(expiry_date=date.today() + timedelta(days=15))
        qs = list(ExpiryPurchaseItem.objects.all())
        assert qs[0] == newer
        assert qs[1] == older
