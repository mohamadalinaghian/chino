# apps/user/tests/factories/account.py
import factory
from apps.user.models import Account


class AccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Account
        django_get_or_create = ("mobile",)

    mobile = factory.Sequence(lambda n: f"0900000{n:04}")
    name = factory.Sequence(lambda n: f"user {n}")
    is_active = True
    is_staff = False
    is_superuser = False

    # THIS IS THE CORRECT WAY
    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        password_to_set = extracted or "testpass123"
        self.set_password(password_to_set)
        self.save(update_fields=["password"])
