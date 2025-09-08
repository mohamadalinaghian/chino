import factory
from apps.inventory.models import Product, Recipe
from faker import Faker

faker = Faker()


class RecipeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Recipe

    produced_product = factory.SubFactory(
        "apps.inventory.tests.factories.ProductFactory",
        type=factory.Iterator(
            [Product.ProductType.PROCESSED, Product.ProductType.SELLABLE]
        ),
    )
    name = factory.LazyFunction(faker.name)
    instruction = factory.LazyFunction(faker.text)
