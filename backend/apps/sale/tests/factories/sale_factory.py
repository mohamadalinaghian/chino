from decimal import Decimal

import factory
from apps.sale.models import Sale
from django.utils import timezone


class SaleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Sale

    state = Sale.State.OPEN
    sale_type = Sale.SaleType.TAKEAWAY
    opened_by = factory.SubFactory("apps.user.tests.factories.AccountFactory")
    opened_at = factory.LazyFunction(timezone.now)
    total_amount = Decimal("0")
