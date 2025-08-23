import factory
from apps.inventory.models import Product


class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Product

    name = factory.Sequence(lambda n: f"product-{n}")
    type = Product.ProductType.RAW
    is_active = True
    is_stock_traceable = True
    is_countable = False
    is_expiry_traceable = False
    note = None
