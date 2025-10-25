import factory
from apps.inventory.models import Product
from apps.inventory.tests.factories import ProductFactory
from apps.menu.models import Menu
from apps.menu.tests.factories import MenuCategoryFactory
from apps.utils.tests.factories import ImageFactory
from factory.django import DjangoModelFactory
from slugify import slugify


class MenuFactory(DjangoModelFactory):
    class Meta:
        model = Menu

    name = factory.SubFactory(
        ProductFactory,
        type=Product.ProductType.SELLABLE,  # Matches limit_choices_to
    )
    price = factory.Faker("pyint", min_value=500, max_value=5000)
    description = factory.Faker("sentence", nb_words=10)
    slug = factory.LazyAttribute(
        lambda obj: slugify(str(obj.name.name), separator="-", allow_unicode=True)
    )
    category = factory.SubFactory(MenuCategoryFactory)
    thumbnail = factory.django.ImageField(
        color="blue",  # Simple blue image for testing
        width=200,
        height=200,
        format="WEBP",
    )
    is_available = True

    @factory.post_generation
    def images(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for image in extracted:
                self.images.add(image)
        else:
            # Add a default related image for tests if needed
            self.images.add(ImageFactory())
