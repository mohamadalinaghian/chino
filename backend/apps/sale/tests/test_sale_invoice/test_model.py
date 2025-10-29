from decimal import Decimal

import pytest
from apps.sale.models import SaleInvoice
from apps.sale.tests.factories.sale_invoice import SaleInvoiceFactory
from apps.sale.tests.factories.sale_item import SaleItemFactory
from django.core.exceptions import ValidationError
from django.utils import timezone


@pytest.mark.django_db
class TestSaleInvoice:
    def test_create_sale_invoice_happy_path(self):
        # Happy path: Valid invoice with staff and customer
        invoice = SaleInvoiceFactory(staff__is_staff=True, customer__is_staff=False)
        assert invoice.id is not None
        assert invoice.bill_status == SaleInvoice.BillStatus.OPEN
        assert invoice.jalali_issue_date is not None
        assert invoice.staff.is_staff is True
        assert invoice.customer.is_staff is False

    def test_create_sale_invoice_without_customer(self):
        # Edge case: Customer is optional (null=True)
        invoice = SaleInvoiceFactory(customer=None)
        assert invoice.id is not None
        assert invoice.customer is None

    def test_create_sale_invoice_invalid_staff(self):
        # Bad path: Staff must be is_staff=True
        with pytest.raises(ValidationError):
            invoice = SaleInvoiceFactory(staff__is_staff=False)
            invoice.full_clean()  # Trigger validation

    def test_bill_status_choices(self):
        # Edge case: Test all valid bill statuses
        for status in SaleInvoice.BillStatus.values:
            invoice = SaleInvoiceFactory(bill_status=status)
            assert invoice.bill_status == status

    def test_invalid_bill_status(self):
        # Bad path: Invalid bill status
        with pytest.raises(ValidationError):
            invoice = SaleInvoiceFactory()
            invoice.bill_status = "INVALID"
            invoice.full_clean()

    def test_total_revenue_no_items(self):
        # Edge case: No SaleItem linked
        invoice = SaleInvoiceFactory()
        assert invoice.total_revenue is None  # Aggregate returns None for empty set

    def test_total_revenue_with_items(self):
        # Happy path: Calculate total revenue with items
        invoice = SaleInvoiceFactory()
        SaleItemFactory(
            sale_invoice=invoice,
            quantity=Decimal("2.000"),
            sold_unit_price=Decimal("100.0000"),
        )
        SaleItemFactory(
            sale_invoice=invoice,
            quantity=Decimal("1.000"),
            sold_unit_price=Decimal("50.0000"),
        )
        assert invoice.total_revenue == Decimal("250.0000")  # (2 * 100) + (1 * 50)

    def test_ordering_by_issue_date(self):
        # Edge case: Test Meta.ordering
        invoice1 = SaleInvoiceFactory(issue_date=timezone.datetime(2025, 10, 25))
        invoice2 = SaleInvoiceFactory(issue_date=timezone.datetime(2025, 10, 26))
        invoices = SaleInvoice.objects.all()
        assert invoices[0] == invoice2  # Newer first
        assert invoices[1] == invoice1

    def test_note_optional(self):
        # Edge case: Note can be null/blank
        invoice = SaleInvoiceFactory(note=None)
        assert invoice.note is None
        invoice = SaleInvoiceFactory(note="")
        assert invoice.note == ""

    def test_str_method(self):
        # Happy path: Test __str__ returns jalali_issue_date
        invoice = SaleInvoiceFactory()
        assert str(invoice) == invoice.jalali_issue_date

    def test_indexes_exist(self):
        # Edge case: Verify Meta.indexes
        indexes = SaleInvoice._meta.indexes
        assert any(index.fields == ["issue_date"] for index in indexes)
        assert any(index.fields == ["bill_status"] for index in indexes)
