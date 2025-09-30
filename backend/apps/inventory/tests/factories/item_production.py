import factory
from apps.inventory.models import ItemProduction


class ItemProductionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ItemProduction

    used_recipe = factory.SubFactory("apps.inventory.tests.factories.RecipeFactory")
    used_quantity = factory.Faker(
        "pydecimal", right_digits=2, left_digits=3, positive=True
    )
    produced_quantity = factory.Faker(
        "pydecimal", right_digits=2, left_digits=3, positive=True
    )
    notes = factory.Faker("text", max_nb_chars=128)

    @factory.post_generation
    def cooperators(self, create, extracted, **kwargs):
        if extracted:
            self.cooperators.set(extracted)
        else:
            from apps.user.tests.factories import (  # Import inside the method to avoid circular import
                AccountFactory,
            )

            account = AccountFactory()
            self.cooperators.set([account])
