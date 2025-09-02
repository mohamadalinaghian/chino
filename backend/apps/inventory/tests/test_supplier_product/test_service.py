from decimal import Decimal

import pytest
from apps.inventory.services import SupplierProductService
from apps.inventory.tests.factories import (
    ProductFactory,
    PurchaseInvoiceFactory,
    SupplierFactory,
    SupplierProductFactory,
)
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestSupplierProductService:

    def test_update_price(self):
        invoice = PurchaseInvoiceFactory(supplier=SupplierFactory())
        product = ProductFactory()
        sp = SupplierProductFactory(supplier=invoice.supplier, product=product)

        new_price = Decimal("1234.56")
        SupplierProductService.update_supplier_product(
            invoice=invoice, product=product, price=new_price, brand=sp.brand
        )

        sp.refresh_from_db()
        assert sp.last_purchase_price == new_price
        assert sp.invoice_related == invoice

    def test_update_price_without_supplier_product_raises(self):
        invoice = PurchaseInvoiceFactory(supplier=SupplierFactory())
        product = ProductFactory()

        with pytest.raises(ValidationError):
            SupplierProductService.update_supplier_product(
                invoice=invoice, product=product, price=Decimal("44.2"), brand=None
            )

    def test_has_supplier_true(self):
        invoice = PurchaseInvoiceFactory(supplier=SupplierFactory())
        assert SupplierProductService.has_supplier(invoice) is True

    def test_has_supplier_false_for_none(self):
        assert SupplierProductService.has_supplier(None) is False

    def test_has_supplier_false_for_invoice_without_supplier(self):
        invoice = PurchaseInvoiceFactory(supplier=None)
        assert SupplierProductService.has_supplier(invoice) is False
