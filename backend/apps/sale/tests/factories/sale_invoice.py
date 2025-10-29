import factory
from apps.sale.models import SaleInvoice
from apps.user.tests.factories.account import AccountFactory
from django.utils import timezone


class SaleInvoiceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SaleInvoice

    issue_date = factory.LazyFunction(timezone.now)
    staff = factory.SubFactory(AccountFactory, is_staff=True)
    customer = factory.SubFactory(AccountFactory, is_staff=False)
    note = factory.Faker("sentence", nb_words=5)
    bill_status = SaleInvoice.BillStatus.OPEN
