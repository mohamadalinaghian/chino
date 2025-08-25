import factory
from apps.inventory.models import PurchaseInvoice
from django.utils import timezone


class PurchaseInvoiceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PurchaseInvoice

    issue_date = factory.LazyFunction(timezone.now)
    staff = factory.SubFactory(
        "apps.user.tests.factories.AccountFactory", is_staff=True
    )
    supplier = None
