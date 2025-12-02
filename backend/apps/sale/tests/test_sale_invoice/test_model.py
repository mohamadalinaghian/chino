from decimal import Decimal

import pytest
from apps.sale.models import SaleInvoice
from apps.sale.tests.factories import (
    PaidSaleInvoiceFactory,
    PartiallyPaidSaleInvoiceFactory,
    RefundedSaleInvoiceFactory,
    SaleInvoiceFactory,
)
from apps.user.tests.factories import AccountFactory
from django.utils import timezone


@pytest.mark.django_db
class TestSaleInvoiceModel:
    def setup_method(self):
        self.staff = AccountFactory(is_staff=True)
        self.customer = AccountFactory(is_staff=False)

    def test_create_sale_invoice_with_all_fields(self):
        invoice = SaleInvoiceFactory(
            staff=self.staff,
            customer=self.customer,
            bill_status=SaleInvoice.BillStatus.OPEN,
            note="Test order",
        )

        assert invoice.staff == self.staff
        assert invoice.customer == self.customer
        assert invoice.bill_status == SaleInvoice.BillStatus.OPEN
        assert invoice.note == "Test order"
        assert invoice.issue_date is not None

    def test_sale_invoice_default_status_is_open(self):
        invoice = SaleInvoiceFactory(staff=self.staff)
        assert invoice.bill_status == SaleInvoice.BillStatus.OPEN

    def test_sale_invoice_all_status_choices(self):
        statuses = [
            SaleInvoice.BillStatus.OPEN,
            SaleInvoice.BillStatus.PARTIALLY_PAID,
            SaleInvoice.BillStatus.PAID,
            SaleInvoice.BillStatus.REFUNDED,
        ]

        for status in statuses:
            invoice = SaleInvoiceFactory(
                staff=self.staff,
                bill_status=status,
            )
            assert invoice.bill_status == status

    def test_sale_invoice_staff_must_be_staff_user(self):
        non_staff = AccountFactory(is_staff=False)
        invoice = SaleInvoiceFactory(staff=non_staff)
        assert invoice.staff is not None

    def test_sale_invoice_customer_optional(self):
        invoice = SaleInvoiceFactory(staff=self.staff, customer=None)
        assert invoice.customer is None

    def test_sale_invoice_cached_total_amount_default(self):
        invoice = SaleInvoice.objects.create(staff=self.staff)
        assert invoice.cached_total_amount == Decimal("0")

    def test_sale_invoice_total_paid_default(self):
        invoice = SaleInvoice.objects.create(staff=self.staff)
        assert invoice.total_paid == Decimal("0")

    def test_sale_invoice_decimal_precision(self):
        invoice = SaleInvoiceFactory(
            staff=self.staff,
            cached_total_amount=Decimal("123456.7890"),
            total_paid=Decimal("50000.1234"),
        )

        invoice.refresh_from_db()
        assert invoice.cached_total_amount == Decimal("123456.7890")
        assert invoice.total_paid == Decimal("50000.1234")

    def test_paid_sale_invoice_factory(self):
        invoice = PaidSaleInvoiceFactory(staff=self.staff)
        assert invoice.bill_status == SaleInvoice.BillStatus.PAID
        assert invoice.total_paid == invoice.cached_total_amount

    def test_partially_paid_sale_invoice_factory(self):
        invoice = PartiallyPaidSaleInvoiceFactory(staff=self.staff)

        assert invoice.bill_status == SaleInvoice.BillStatus.PARTIALLY_PAID
        assert invoice.total_paid > Decimal("0")
        assert invoice.total_paid < invoice.cached_total_amount

    def test_refunded_sale_invoice_factory(self):
        invoice = RefundedSaleInvoiceFactory(staff=self.staff)
        assert invoice.bill_status == SaleInvoice.BillStatus.REFUNDED

    def test_sale_invoice_relationship_with_staff(self):
        invoice = SaleInvoiceFactory(staff=self.staff)
        assert invoice.staff == self.staff
        assert invoice in self.staff.sale_invoices.all()

    def test_sale_invoice_relationship_with_customer(self):
        invoice = SaleInvoiceFactory(
            staff=self.staff,
            customer=self.customer,
        )

        assert invoice.customer == self.customer
        assert invoice in self.customer.customer_invoices.all()

    def test_sale_invoice_protect_staff_on_delete(self):
        invoice = SaleInvoiceFactory(staff=self.staff)

        with pytest.raises(Exception):
            self.staff.delete()

        assert SaleInvoice.objects.filter(pk=invoice.pk).exists()

    def test_sale_invoice_set_null_customer_on_delete(self):
        invoice = SaleInvoiceFactory(
            staff=self.staff,
            customer=self.customer,
        )

        self.customer.delete()
        invoice.refresh_from_db()

        assert invoice.customer is None

    def test_sale_invoice_str_method(self):
        invoice = SaleInvoiceFactory(staff=self.staff)

        s = str(invoice)
        assert str(invoice.pk) in s
        assert isinstance(s, str)

    def test_sale_invoice_jalali_issue_date_property(self):
        invoice = SaleInvoiceFactory(staff=self.staff)

        jalali_date = invoice.jalali_issue_date
        assert isinstance(jalali_date, str)
        assert len(jalali_date) > 0

    def test_sale_invoice_ordering(self):
        inv1 = SaleInvoiceFactory(
            staff=self.staff,
            issue_date=timezone.now() - timezone.timedelta(days=2),
        )
        inv2 = SaleInvoiceFactory(
            staff=self.staff,
            issue_date=timezone.now() - timezone.timedelta(days=1),
        )
        inv3 = SaleInvoiceFactory(
            staff=self.staff,
            issue_date=timezone.now(),
        )

        invoices = SaleInvoice.objects.all()
        assert invoices[0] == inv3
        assert invoices[1] == inv2
        assert invoices[2] == inv1

    def test_sale_invoice_timestamps(self):
        invoice = SaleInvoiceFactory(staff=self.staff)

        assert invoice.created_at is not None
        assert invoice.updated_at is not None

        before = invoice.updated_at

        invoice.note = "Updated note"
        invoice.save()

        assert invoice.updated_at > before

    def test_sale_invoice_note_field_optional(self):
        invoice = SaleInvoiceFactory(staff=self.staff, note="")
        assert invoice.note == ""

    def test_sale_invoice_default_issue_date(self):
        before = timezone.now()
        invoice = SaleInvoiceFactory(staff=self.staff)
        after = timezone.now()

        assert invoice.issue_date >= before
        assert invoice.issue_date <= after
