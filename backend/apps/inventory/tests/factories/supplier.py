import factory
from apps.inventory.models import Supplier
from apps.inventory.models.supplier_product import SupplierProduct


class SupplierFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Supplier

    company_name = factory.Sequence(lambda n: f"company-{n}")
    info = None

    @factory.post_generation
    def products(self, create, extracted, **kwargs):
        """
        Beacause of ManyToMany relation we need to post save.
        """
        if not create:
            return

        if extracted:
            for item in extracted:
                SupplierProduct.objects.create(supplier=self, **item)
