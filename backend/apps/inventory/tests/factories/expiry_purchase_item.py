# apps/inventory/tests/factories/expiry_purchase_item.py
from datetime import date, timedelta

import factory
from apps.inventory.models import ExpiryPurchaseItem


class ExpiryPurchaseItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ExpiryPurchaseItem

    purchased_item = factory.SubFactory(
        "apps.inventory.tests.factories.PurchaseItemFactory"
    )
    expiry_date = factory.LazyFunction(lambda: date.today() + timedelta(days=10))
