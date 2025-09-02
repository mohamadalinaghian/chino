import factory
from apps.user.models import Account


class AccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Account

    mobile = factory.Sequence(lambda n: f"0900000{n:04}")
    name = factory.Sequence(lambda n: f"user {n}")
    is_active = True
    is_superuser = False
    is_staff = True
