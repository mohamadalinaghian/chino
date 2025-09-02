import pytest
from apps.inventory.models import Product
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError

from ..factories import ProductFactory


@pytest.mark.django_db
class TestProduct:

    # Happy path
    def test_factory_creates_product(self):
        p = ProductFactory()
        assert p.pk is not None

    def test_str_returns_name(self):
        p = ProductFactory(name="X")
        assert str(p) == "X"

    def test_type_choices_validation(self):
        p = ProductFactory.build()
        p.type = "INVALID"
        with pytest.raises(ValidationError):
            p.full_clean()

    def test_default_ordering_by_type(self):
        ProductFactory(type=Product.ProductType.RAW)
        ProductFactory(type=Product.ProductType.SELLABLE)
        names = list(Product.objects.values_list("type", flat=True))
        assert names == sorted(names)

    def test_has_is_active_index(self):
        assert any(idx.name == "is_active_idx" for idx in Product._meta.indexes)

    def test_has_name_type_uq_constraint(self):
        assert any(
            uq.name == "uq_product_name_type" for uq in Product._meta.constraints
        )

    def test_error_on_nameless_product(self):
        p = ProductFactory.build()
        p.name = None

        with pytest.raises(ValidationError):
            p.full_clean()

    def test_error_on_duplicate_product(self):

        name = "test_error"
        ProductFactory(name=name)

        with pytest.raises(IntegrityError):
            ProductFactory(name=name)
