"""
Tests for Transaction model.

Covers:
- Model creation and validation
- Field constraints
- Relationships
- String representation
- Jalali date property
"""

from decimal import Decimal

import pytest
from apps.sale.models import Transaction
from apps.sale.tests.factories import (
    SaleInvoiceFactory,
    TransactionFactory,
    UnverifiedTransactionFactory,
)
from apps.user.tests.factories import AccountFactory
from django.utils import timezone


@pytest.mark.django_db
class TestTransactionModel:
    def test_create_transaction_with_all_fields(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        transaction = TransactionFactory(
            invoice=invoice,
            amount=Decimal("50000.0000"),
            payment_type=Transaction.PaymentType.CASH,
            verified_by=staff,
        )

        assert transaction.invoice == invoice
        assert transaction.amount == Decimal("50000.0000")
        assert transaction.payment_type == Transaction.PaymentType.CASH
        assert transaction.is_verified is True
        assert transaction.verified_by == staff
        assert transaction.verification_date is not None

    def test_create_unverified_transaction(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        transaction = UnverifiedTransactionFactory(invoice=invoice)

        assert transaction.is_verified is False
        assert transaction.verified_by is None
        assert transaction.verification_date is None

    def test_transaction_payment_type_choices(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        payment_types = [
            Transaction.PaymentType.POS,
            Transaction.PaymentType.CASH,
            Transaction.PaymentType.CARD_TO_CARD,
        ]

        for payment_type in payment_types:
            transaction = TransactionFactory(
                invoice=invoice,
                payment_type=payment_type,
            )
            assert transaction.payment_type == payment_type

    def test_transaction_amount_precision(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        transaction = TransactionFactory(
            invoice=invoice,
            amount=Decimal("12345.6789"),
        )

        transaction.refresh_from_db()
        assert transaction.amount == Decimal("12345.6789")

    def test_transaction_default_payment_date(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        before = timezone.now()
        transaction = TransactionFactory(invoice=invoice)
        after = timezone.now()

        assert before <= transaction.payment_date <= after

    def test_transaction_default_is_verified(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        transaction = TransactionFactory(invoice=invoice)
        assert transaction.is_verified is True

    def test_transaction_relationship_with_invoice(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        transaction = TransactionFactory(invoice=invoice)

        assert transaction.invoice == invoice
        assert transaction in invoice.transactions.all()

    def test_transaction_cascade_on_invoice_protect(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        transaction = TransactionFactory(invoice=invoice)

        with pytest.raises(Exception):
            invoice.delete()

        assert Transaction.objects.filter(pk=transaction.pk).exists()

    def test_transaction_str_method(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        transaction = TransactionFactory(
            invoice=invoice,
            payment_type=Transaction.PaymentType.POS,
            amount=Decimal("50000"),
        )

        text = str(transaction)
        assert "POS" in text
        assert "50000" in text

    def test_transaction_jalali_payment_date_property(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        transaction = TransactionFactory(invoice=invoice)

        jalali = transaction.jalali_payment_date
        assert isinstance(jalali, str)
        assert len(jalali) > 0

    def test_transaction_note_field_optional(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        transaction = TransactionFactory(invoice=invoice, note="")
        assert transaction.note == ""

    def test_transaction_note_max_length(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        long_note = "A" * 512
        transaction = TransactionFactory(invoice=invoice, note=long_note)

        assert len(transaction.note) == 512

    def test_transaction_ordering(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        trans1 = TransactionFactory(
            invoice=invoice,
            payment_date=timezone.now() - timezone.timedelta(days=2),
        )
        trans2 = TransactionFactory(
            invoice=invoice,
            payment_date=timezone.now() - timezone.timedelta(days=1),
        )
        trans3 = TransactionFactory(
            invoice=invoice,
            payment_date=timezone.now(),
        )

        transactions = list(Transaction.objects.all())

        assert transactions[0] == trans3
        assert transactions[1] == trans2
        assert transactions[2] == trans1

    def test_transaction_updated_at_auto_now(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        transaction = TransactionFactory(invoice=invoice)
        before = transaction.updated_at

        transaction.note = "Updated note"
        transaction.save()

        assert transaction.updated_at > before

    def test_multiple_transactions_for_one_invoice(self):
        staff = AccountFactory(is_staff=True)
        invoice = SaleInvoiceFactory(staff=staff)

        trans1 = TransactionFactory(
            invoice=invoice,
            amount=Decimal("30000"),
            payment_type=Transaction.PaymentType.CASH,
        )
        trans2 = TransactionFactory(
            invoice=invoice,
            amount=Decimal("20000"),
            payment_type=Transaction.PaymentType.POS,
        )

        qs = invoice.transactions.all()

        assert qs.count() == 2
        assert trans1 in qs
        assert trans2 in qs
