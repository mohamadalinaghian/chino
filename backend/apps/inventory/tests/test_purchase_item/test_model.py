from decimal import Decimal

import pytest
from apps.inventory.models import PurchaseItem
from apps.inventory.tests.factories.product import ProductFactory
from apps.inventory.tests.factories.purchase_invoice import PurchaseInvoiceFactory
from apps.inventory.tests.factories.purchase_item import PurchaseItemFactory
from django.db import IntegrityError


@pytest.mark.django_db
class TestPurchaseItemModel:
    def test_str_representation(self):
        item = PurchaseItemFactory()
        assert str(item) == f"{item.purchased_product}: {item.purchase_invoice}"

    def test_total_cost_property(self):
        item = PurchaseItemFactory(
            quantity=Decimal("3"), purchased_unit_price=Decimal("10")
        )
        assert item.total_cost == Decimal("30")

    def test_unique_constraint(self):
        invoice = PurchaseInvoiceFactory()
        product = ProductFactory()
        PurchaseItemFactory(purchase_invoice=invoice, purchased_product=product)
        with pytest.raises(IntegrityError):
            PurchaseItemFactory(purchase_invoice=invoice, purchased_product=product)

    def test_ordering_by_purchase_invoice(self):
        invoice1 = PurchaseInvoiceFactory()
        invoice2 = PurchaseInvoiceFactory()
        PurchaseItemFactory(purchase_invoice=invoice1)
        PurchaseItemFactory(purchase_invoice=invoice2)
        items = list(PurchaseItem.objects.all())
        assert items[0].purchase_invoice.pk <= items[1].purchase_invoice.pk
