import pytest
from apps.inventory.tests.factories import PurchaseInvoiceFactory, SupplierFactory
from apps.user.tests.factories import AccountFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestPurchaseInvoice:
    # Happy path
    def test_create_invoice(self):
        pi = PurchaseInvoiceFactory()

        assert pi.pk is not None
        assert str(pi) == str(pi.jalali_issue_date)
        assert pi.staff.is_staff is True

    def test_invoice_with_supplier(self):
        supplier = SupplierFactory()
        pi = PurchaseInvoiceFactory(supplier=supplier)
        assert pi.supplier == supplier

    ###########################################
    # Unhappy path
    def test_error_unstaff(self):
        unstaff = AccountFactory(is_staff=False)
        with pytest.raises(ValidationError):
            PurchaseInvoiceFactory(staff=unstaff)
