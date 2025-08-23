import pytest
from apps.inventory.services.product_service import ProductService


@pytest.mark.django_db
class TestProductService:
    def test_get_or_create_creates_once(self, product):
        p1, created1 = ProductService.get_or_create_product(**product)
        p2, created2 = ProductService.get_or_create_product(**product)

        assert created1 is True
        assert created2 is False
        assert p1.pk == p2.pk

    def test_get_active_products_filters_only_active(self, product):
        a, _ = ProductService.get_or_create_product(**product)
        product_copy = product.copy()
        product_copy.update(name="product test 2", is_active=False)
        b, _ = ProductService.get_or_create_product(**product_copy)
        qs = ProductService.get_active_products()

        assert a in qs
        assert b not in qs

    def test_deactivate_product_updates_flag(self, product):
        p, _ = ProductService.get_or_create_product(**product)
        updated = ProductService.deactivate_product(p.id)

        assert updated == 1

        p.refresh_from_db()

        assert p.is_active is False

        p, _ = ProductService.get_or_create_product(**product)

        assert p.is_active is False

    def test_error_on_create_without_name(self, product):
        product = product.pop("name")

        with pytest.raises(TypeError):
            ProductService.get_or_create_product(**product)

    def test_error_on_create_without_type(self, product):
        product = product.pop("type")

        with pytest.raises(TypeError):
            ProductService.get_or_create_product(**product)

    def test_error_on_get_nonexisted_id(self, product):
        result = ProductService.deactivate_product(1)

        assert result == 0
