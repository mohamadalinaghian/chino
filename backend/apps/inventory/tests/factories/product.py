import factory
from apps.inventory.models import Product


class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Product

    name = factory.Sequence(lambda n: f"product-{n}")
    type = factory.Iterator(
        [
            Product.ProductType.RAW,
            Product.ProductType.CONSUMABLE,
            Product.ProductType.PROCESSED,
            Product.ProductType.SELLABLE,
        ]
    )

    is_active = True
    is_stock_traceable = True
    is_countable = False
    is_expiry_traceable = False
    note = None
    last_purchased_price = factory.Faker(
        "pydecimal", left_digits=5, right_digits=2, positive=True
    )
