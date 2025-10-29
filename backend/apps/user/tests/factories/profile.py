import factory
from apps.user.models import Profile
from apps.user.tests.factories.account import AccountFactory


class ProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Profile

    user = factory.SubFactory(AccountFactory)
    email = factory.Sequence(lambda n: f"user{n}@example.com")
    is_email_verified = False
    address = factory.Faker("address")
    birth_date = factory.Faker("date_of_birth", minimum_age=18, maximum_age=80)
    sex = factory.Iterator([True, False])  # Male, Female
