import random

import factory
from apps.user.models import Account


class AccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Account

    mobile = "0" + "".join(str(random.randint(0, 9)) for _ in range(10))
    name = factory.Sequence(lambda n: f"user {n}")
    is_active = True
    is_superuser = False
    is_staff = True
