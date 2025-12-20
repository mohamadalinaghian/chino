from random import Random

import factory
from apps.inventory.models import Table

r = Random()


class TableFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Table

    name = factory.Sequence(lambda n: f"T{n}")
    capacity = r.randrange(1, 20)
    is_active = True
