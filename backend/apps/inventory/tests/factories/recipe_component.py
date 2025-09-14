import factory
from apps.inventory.models import RecipeComponent


class RecipeComponentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = RecipeComponent

    recipe = factory.SubFactory("apps.inventory.tests.factories.RecipeFactory")
    consume_product = factory.SubFactory(
        "apps.inventory.tests.factories.ProductFactory"
    )
    quantity = factory.Faker("pydecimal", right_digits=5, left_digits=3, positive=True)
