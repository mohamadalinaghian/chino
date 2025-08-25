import factory
from apps.inventory.models import SupplierProduct
from django.utils import timezone


class SupplierProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SupplierProduct

    supplier = factory.SubFactory("apps.inventory.tests.factories.SupplierFactory")
    product = factory.SubFactory("apps.inventory.tests.factories.ProductFactory")
    brand = factory.LazyAttribute(lambda n: f"{n.supplier} -- {n.product}")
    last_purchase_price = factory.Faker(
        "pydecimal", left_digits=5, right_digits=2, positive=True
    )
    last_price_date = factory.LazyFunction(timezone.now)
