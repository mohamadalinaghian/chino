from decimal import Decimal

import pytest
from apps.inventory.models import SupplierProduct
from apps.inventory.tests.factories import ProductFactory, SupplierFactory
from django.db import IntegrityError


@pytest.mark.django_db
class TestSupplier:

    # -----------------------------
    # Helper
    # -----------------------------
    def _assert_supplier_has_product(self, supplier, product, brand=None, price=None):
        """Helper to assert supplier-product relation exists with given attrs."""
        assert product in supplier.products.all()
        sp = supplier.supplier_products.get(product=product)
        if brand is not None:
            assert sp.brand == brand
        if price is not None:
            assert sp.last_purchase_price == price
        return sp

    # -----------------------------
    # Happy path
    # -----------------------------
    def test_create_supplier(self):
        s = SupplierFactory()
        assert s.pk is not None
        assert str(s) == s.company_name

    def test_create_supplier_with_info(self):
        info = "this is a test note"
        s = SupplierFactory(info=info)
        assert s.info == info

    def test_create_supplier_with_product_and_brand(self):
        p = ProductFactory()
        brand = "test brand"
        s = SupplierFactory(products=[{"product": p, "brand": brand}])
        self._assert_supplier_has_product(s, p, brand=brand)

    def test_create_supplier_with_brand_and_last_price(self):
        p = ProductFactory()
        brand = "test brand"
        last_price = Decimal("300123")
        s = SupplierFactory(
            products=[{"product": p, "brand": brand, "last_purchase_price": last_price}]
        )
        self._assert_supplier_has_product(s, p, brand=brand, price=last_price)

    def test_create_supplier_with_only_product(self):
        p = ProductFactory()
        s = SupplierFactory(products=[{"product": p}])
        self._assert_supplier_has_product(s, p)

    def test_create_supplier_with_product_and_last_price(self):
        p = ProductFactory()
        last_price = Decimal("123.45")
        s = SupplierFactory(
            products=[{"product": p, "last_purchase_price": last_price}]
        )
        self._assert_supplier_has_product(s, p, price=last_price)

    def test_add_products_to_supplier(self):
        s = SupplierFactory()
        # With brand
        p1 = ProductFactory()
        s.products.add(p1, through_defaults={"brand": "BrandX"})
        self._assert_supplier_has_product(s, p1, brand="BrandX")

        # Without brand
        p2 = ProductFactory()
        s.products.add(p2)
        self._assert_supplier_has_product(s, p2)

        # With brand and last price
        p3 = ProductFactory()
        s.products.add(
            p3,
            through_defaults={"brand": "BrandY", "last_purchase_price": Decimal("500")},
        )
        self._assert_supplier_has_product(s, p3, brand="BrandY", price=Decimal("500"))

    # -----------------------------
    # Unhappy path
    # -----------------------------
    def test_error_supplier_without_company_name(self):
        with pytest.raises(IntegrityError):
            SupplierFactory(company_name=None)

    def test_error_duplicate_company_name(self):
        SupplierFactory(company_name="TestCo")
        with pytest.raises(IntegrityError):
            SupplierFactory(company_name="TestCo")

    def test_error_duplicate_product_with_same_brand(self):
        p = ProductFactory()
        s = SupplierFactory(products=[{"product": p, "brand": "BrandX"}])
        with pytest.raises(IntegrityError):
            SupplierProduct.objects.create(supplier=s, product=p, brand="BrandX")

    def test_error_duplicate_product_without_brand(self):
        p = ProductFactory()
        s = SupplierFactory(products=[{"product": p}])
        with pytest.raises(IntegrityError):
            SupplierProduct.objects.create(supplier=s, product=p)
