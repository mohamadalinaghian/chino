"""
Tests for PaymentService.

Covers:
- POS payment creation
- Cash payment creation
- Card-to-card payment creation
- Split payments
- Payment validation
- Invoice status updates after payment

IMPORTANT: Invoices must exist with items before creating payments.
"""

from decimal import Decimal

import pytest
from apps.inventory.models import Product
from apps.inventory.services import StockService
from apps.inventory.tests.factories import ProductFactory
from apps.sale.models import SaleInvoice, Transaction
from apps.sale.services.payment import PaymentService
from apps.sale.services.sale_invoice import SaleInvoiceService
from apps.user.tests.factories import AccountFactory, BankAccountFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestPaymentService:
    """Test suite for PaymentService."""

    def setup_method(self):
        """Set up test data with products in stock and an invoice."""
        self.staff = AccountFactory(is_staff=True)
        self.bank_account = BankAccountFactory()

        # Create sellable product with stock
        self.product = ProductFactory(
            type=Product.ProductType.SELLABLE,
            is_active=True,
            is_stock_traceable=True,
        )

        StockService.add_to_stock(
            product=self.product,
            unit_price=Decimal("5000"),
            quantity=Decimal("100.000"),
        )

        # Create invoice
        items = [
            {
                "product": self.product,
                "quantity": Decimal("5.000"),
                "unit_price": Decimal("10000.0000"),
                "discount_amount": Decimal("0"),
                "sale_method": "STOCK",
            }
        ]

        self.invoice = SaleInvoiceService.create_order(
            staff=self.staff,
            items=items,
        )

    def test_create_pos_payment(self):
        """Test creating a POS terminal payment."""
        payment_amount = Decimal("50000.0000")

        transaction = PaymentService.create_pos_payment(
            invoice=self.invoice,
            amount=payment_amount,
            target_account=self.bank_account,
            verified_by=self.staff,
        )

        assert transaction.pk is not None
        assert transaction.amount == payment_amount
        assert transaction.payment_type == Transaction.PaymentType.POS
        assert transaction.is_verified
        assert transaction.verified_by == self.staff
        assert hasattr(transaction, "pos_details")
        assert transaction.pos_details.target_account == self.bank_account

        self.invoice.refresh_from_db()
        assert self.invoice.total_paid == payment_amount
        assert self.invoice.bill_status == SaleInvoice.BillStatus.PAID

    def test_create_cash_payment(self):
        """Test creating a cash payment."""
        payment_amount = Decimal("50000.0000")
        register_id = "REG-001"

        transaction = PaymentService.create_cash_payment(
            invoice=self.invoice,
            amount=payment_amount,
            verified_by=self.staff,
            cash_register_id=register_id,
        )

        assert transaction.pk is not None
        assert transaction.amount == payment_amount
        assert transaction.payment_type == Transaction.PaymentType.CASH
        assert hasattr(transaction, "cash_details")
        assert transaction.cash_details.cash_register_id == register_id

        self.invoice.refresh_from_db()
        assert self.invoice.total_paid == payment_amount
        assert self.invoice.bill_status == SaleInvoice.BillStatus.PAID

    def test_create_card_transfer_payment(self):
        """Test creating a card-to-card transfer payment."""
        payment_amount = Decimal("50000.0000")

        transaction = PaymentService.create_card_transfer(
            invoice=self.invoice,
            amount=payment_amount,
            destination_account=self.bank_account,
            verified_by=self.staff,
        )

        assert transaction.pk is not None
        assert transaction.amount == payment_amount
        assert transaction.payment_type == Transaction.PaymentType.CARD_TO_CARD
        assert hasattr(transaction, "card_transfer_details")
        assert (
            transaction.card_transfer_details.destination_account == self.bank_account
        )

        self.invoice.refresh_from_db()
        assert self.invoice.total_paid == payment_amount

    def test_payment_amount_must_be_positive(self):
        """Test that payment amount must be positive."""
        with pytest.raises(ValidationError) as cm:
            PaymentService.create_cash_payment(
                invoice=self.invoice,
                amount=Decimal("0"),
                verified_by=self.staff,
            )
        assert "positive" in str(cm.value).lower()

        with pytest.raises(ValidationError) as cm:
            PaymentService.create_cash_payment(
                invoice=self.invoice,
                amount=Decimal("-1000"),
                verified_by=self.staff,
            )
        assert "positive" in str(cm.value).lower()

    def test_partial_payment_updates_status(self):
        """Test that partial payment updates invoice to PARTIALLY_PAID."""
        partial_amount = Decimal("25000.0000")

        PaymentService.create_cash_payment(
            invoice=self.invoice,
            amount=partial_amount,
            verified_by=self.staff,
        )

        self.invoice.refresh_from_db()
        assert self.invoice.bill_status == SaleInvoice.BillStatus.PARTIALLY_PAID
        assert self.invoice.total_paid == partial_amount

    def test_split_payment_with_multiple_methods(self):
        """Test split payment using cash and POS."""
        account2 = BankAccountFactory(card_number="6037991569159811")

        payments = [
            {
                "type": "CASH",
                "amount": Decimal("30000.0000"),
                "verified_by": self.staff,
            },
            {
                "type": "POS",
                "amount": Decimal("20000.0000"),
                "account": account2,
                "verified_by": self.staff,
            },
        ]

        transactions = PaymentService.split_payment(
            invoice=self.invoice, payments=payments
        )
        assert len(transactions) == 2

        payment_types = [t.payment_type for t in transactions]
        assert Transaction.PaymentType.CASH in payment_types
        assert Transaction.PaymentType.POS in payment_types

        self.invoice.refresh_from_db()
        assert self.invoice.total_paid == Decimal("50000.0000")
        assert self.invoice.bill_status == SaleInvoice.BillStatus.PAID

    def test_split_payment_three_methods(self):
        """Test split payment with cash, POS, and card transfer."""
        pos_account = BankAccountFactory(card_number="6037991569159811")
        card_account = BankAccountFactory(card_number="6037991569159812")

        payments = [
            {
                "type": "CASH",
                "amount": Decimal("20000.0000"),
                "verified_by": self.staff,
            },
            {
                "type": "POS",
                "amount": Decimal("15000.0000"),
                "account": pos_account,
                "verified_by": self.staff,
            },
            {
                "type": "CARD_TO_CARD",
                "amount": Decimal("15000.0000"),
                "account": card_account,
                "verified_by": self.staff,
            },
        ]

        transactions = PaymentService.split_payment(
            invoice=self.invoice, payments=payments
        )
        assert len(transactions) == 3

        self.invoice.refresh_from_db()
        assert self.invoice.total_paid == Decimal("50000.0000")
        assert self.invoice.bill_status == SaleInvoice.BillStatus.PAID

    def test_multiple_payments_for_one_invoice(self):
        """Test making multiple separate payments for one invoice."""
        PaymentService.create_cash_payment(
            invoice=self.invoice, amount=Decimal("20000.0000"), verified_by=self.staff
        )
        self.invoice.refresh_from_db()
        assert self.invoice.bill_status == SaleInvoice.BillStatus.PARTIALLY_PAID

        PaymentService.create_pos_payment(
            invoice=self.invoice,
            amount=Decimal("30000.0000"),
            target_account=self.bank_account,
            verified_by=self.staff,
        )
        self.invoice.refresh_from_db()
        assert self.invoice.total_paid == Decimal("50000.0000")
        assert self.invoice.bill_status == SaleInvoice.BillStatus.PAID

    def test_overpayment_is_allowed(self):
        """Test that overpayment is allowed (for change scenarios)."""
        overpayment = Decimal("60000.0000")
        transaction = PaymentService.create_cash_payment(
            invoice=self.invoice, amount=overpayment, verified_by=self.staff
        )
        assert transaction.pk is not None

        self.invoice.refresh_from_db()
        assert self.invoice.total_paid == overpayment

    def test_get_daily_payment_summary(self):
        """Test getting payment summary for a specific date."""
        today = self.invoice.issue_date.date()

        PaymentService.create_cash_payment(
            invoice=self.invoice, amount=Decimal("20000.0000"), verified_by=self.staff
        )
        PaymentService.create_pos_payment(
            invoice=self.invoice,
            amount=Decimal("30000.0000"),
            target_account=self.bank_account,
            verified_by=self.staff,
        )

        summary = PaymentService.get_daily_payment_summary(today)
        assert summary.get(Transaction.PaymentType.CASH) == Decimal("20000.0000")
        assert summary.get(Transaction.PaymentType.POS) == Decimal("30000.0000")

    def test_transaction_linked_to_invoice(self):
        """Test that transactions are properly linked to invoice."""
        PaymentService.create_cash_payment(
            invoice=self.invoice, amount=Decimal("50000.0000"), verified_by=self.staff
        )
        assert self.invoice.transactions.count() == 1

        transaction = self.invoice.transactions.first()
        assert transaction.invoice == self.invoice

    def test_payment_with_invalid_payment_type(self):
        """Test that invalid payment type in split payment raises error."""
        payments = [
            {
                "type": "INVALID_TYPE",
                "amount": Decimal("50000.0000"),
                "verified_by": self.staff,
            }
        ]
        with pytest.raises(ValidationError) as cm:
            PaymentService.split_payment(invoice=self.invoice, payments=payments)

        assert "payment type" in str(cm.value).lower()
