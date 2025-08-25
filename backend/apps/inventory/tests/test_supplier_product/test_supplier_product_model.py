import pytest
from apps.inventory.tests.factories import SupplierProductFactory
from django.db import IntegrityError


@pytest.mark.django_db
class TestSupplierProduct:
    # Happy path
    def test_create_supplier_product(self):
        sp = SupplierProductFactory()

        assert sp.pk is not None
        assert str(sp) == f"{sp.supplier}: {sp.product}"

    #######################################
    # Unhappy path
    def test_error_on_create_without_product(self):
        with pytest.raises(IntegrityError):
            SupplierProductFactory(product=None)

    def test_error_on_create_without_supplier(self):
        with pytest.raises(IntegrityError):
            SupplierProductFactory(supplier=None)

    def test_error_on_duplicates(self):
        sp1 = SupplierProductFactory()
        with pytest.raises(IntegrityError):
            SupplierProductFactory(
                supplier=sp1.supplier,
                product=sp1.product,
                brand=sp1.brand,
            )

    def test_error_on_duplicates_null(self):
        sp1 = SupplierProductFactory(brand=None)
        with pytest.raises(IntegrityError):
            SupplierProductFactory(
                supplier=sp1.supplier,
                product=sp1.product,
                brand=sp1.brand,
            )
