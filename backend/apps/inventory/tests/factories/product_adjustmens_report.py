import factory
from apps.inventory.models import ProductAdjustmentReport
from django.utils import timezone


class ProductAdjustmentReportFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProductAdjustmentReport

    product = factory.SubFactory("apps.inventory.tests.factories.ProductFactory")
    staff = factory.SubFactory(
        "apps.user.tests.factories.AccountFactory", is_staff=True
    )
    previous_quantity = factory.Faker(
        "pydecimal", right_digits=2, left_digits=3, positive=True
    )
    current_quantity = factory.Faker(
        "pydecimal", right_digits=2, left_digits=3, positive=True
    )
    cost = factory.Faker("pydecimal", right_digits=2, left_digits=3, positive=True)
    report_date = factory.LazyFunction(timezone.now)
