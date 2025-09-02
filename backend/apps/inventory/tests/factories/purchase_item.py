import factory
from apps.inventory.models import PurchaseItem


class PurchaseItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PurchaseItem

    purchase_invoice = factory.SubFactory(
        "apps.inventory.tests.factories.PurchaseInvoiceFactory"
    )
    purchased_product = factory.SubFactory(
        "apps.inventory.tests.factories.ProductFactory"
    )
    quantity = factory.Faker("pydecimal", left_digits=5, right_digits=2, positive=True)
    purchased_unit_price = factory.Faker(
        "pydecimal", left_digits=5, right_digits=2, positive=True
    )
