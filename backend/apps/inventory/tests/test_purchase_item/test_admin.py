import pytest
from apps.inventory.admin.purchase_item import PurchaseItemInline
from apps.inventory.forms.purchase_item import PurchaseItemInlineForm
from apps.inventory.models import PurchaseItem
from apps.inventory.tests.factories import PurchaseInvoiceFactory, PurchaseItemFactory


@pytest.mark.django_db
class TestPurchaseItemInlineAdmin:
    def test_inline_configuration(self):
        inline = PurchaseItemInline(PurchaseItem, None)

        assert inline.model == PurchaseItem
        assert inline.form == PurchaseItemInlineForm
        assert inline.extra == 0
        assert "purchased_product" in inline.autocomplete_fields

        fieldset_titles = [fs[0] for fs in inline.fieldsets]
        assert "Product Info" in fieldset_titles
        assert "Quantity & Packaging" in fieldset_titles
        assert "Pricing" in fieldset_titles

    def test_admin_change_page_renders_inline(self, admin_client):
        # ساختن یک فاکتور با آیتم
        invoice = PurchaseInvoiceFactory()
        PurchaseItemFactory(purchase_invoice=invoice)

        url = f"/admin/inventory/purchaseinvoice/{invoice.id}/change/"
        response = admin_client.get(url)

        assert response.status_code == 200
        assert b"Purchase Items" in response.content
        assert b"Product Info" in response.content
        assert b"Quantity & Packaging" in response.content
        assert b"Pricing" in response.content
