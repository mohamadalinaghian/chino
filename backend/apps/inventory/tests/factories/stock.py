import factory
from apps.inventory.models import Stock
from django.utils import timezone


class StockFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Stock

    stored_product = factory.SubFactory("apps.inventory.tests.factories.ProductFactory")
    initial_quantity = factory.Faker("pydecimal", right_digits=10, left_digits=2)
    remaining_quantity = factory.Faker("pydecimal", right_digits=10, left_digits=2)
    create_at = factory.LazyFunction(timezone.now)
    unit_price = factory.Faker(
        "pydecimal", right_digits=10, left_digits=2, positive=True
    )
