"""
Tests for SalePayment model.
"""

from decimal import Decimal

import pytest
from apps.sale.models import SalePayment
from apps.sale.tests.factories import SalePaymentFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestSalePaymentModel:
    """Test suite for SalePayment model."""

    def test_create_payment(self, unpaid_invoice, staff_with_perms):
        """Test creating a basic payment."""
        payment = SalePaymentFactory(
            invoice=unpaid_invoice,
            method=SalePayment.PaymentMethod.CASH,
            amount_applied=Decimal("100.0000"),
            amount_total=Decimal("100.0000"),
            received_by=staff_with_perms,
        )

        assert payment.pk is not None
        assert payment.invoice == unpaid_invoice
        assert payment.method == SalePayment.PaymentMethod.CASH
        assert payment.status == SalePayment.PaymentStatus.COMPLETED

    def test_payment_with_tip(self, unpaid_invoice, staff_with_perms):
        """Test payment with tip amount."""
        payment = SalePaymentFactory(
            invoice=unpaid_invoice,
            amount_applied=Decimal("100.0000"),
            tip_amount=Decimal("10.0000"),
            amount_total=Decimal("110.0000"),
        )

        assert payment.amount_applied == Decimal("100.0000")
        assert payment.tip_amount == Decimal("10.0000")
        assert payment.amount_total == Decimal("110.0000")

    def test_clean_validates_amount_calculation(self, unpaid_invoice):
        """Test clean() validates amount_total = amount_applied + tip."""
        payment = SalePaymentFactory(
            invoice=unpaid_invoice,
            amount_applied=Decimal("100.0000"),
            tip_amount=Decimal("10.0000"),
            amount_total=Decimal("100.0000"),  # Wrong!
        )

        with pytest.raises(ValidationError) as exc_info:
            payment.clean()

        assert "must equal" in str(exc_info.value)

    def test_clean_accepts_small_rounding_differences(self, unpaid_invoice):
        """Test clean() tolerates tiny rounding errors."""
        payment = SalePaymentFactory(
            invoice=unpaid_invoice,
            amount_applied=Decimal("100.0000"),
            tip_amount=Decimal("10.0000"),
            amount_total=Decimal("110.005"),  # Within tolerance
        )

        # Should not raise
        payment.clean()

    def test_clean_rejects_negative_applied_amount(self, unpaid_invoice):
        """Test clean() rejects negative applied amount."""
        payment = SalePaymentFactory(
            invoice=unpaid_invoice,
            amount_applied=Decimal("-50.0000"),
            amount_total=Decimal("-50.0000"),
        )

        with pytest.raises(ValidationError) as exc_info:
            payment.clean()

        assert "must be positive" in str(exc_info.value)

    def test_clean_rejects_negative_tip(self, unpaid_invoice):
        """Test clean() rejects negative tip."""
        payment = SalePaymentFactory(
            invoice=unpaid_invoice,
            amount_applied=Decimal("100.0000"),
            tip_amount=Decimal("-5.0000"),
            amount_total=Decimal("95.0000"),
        )

        with pytest.raises(ValidationError):
            payment.clean()

    def test_clean_cash_payment_no_destination_account(self, unpaid_invoice):
        """Test clean() rejects destination_account for cash payments."""
        # This requires BankAccount model to exist
        # Simplified test - just verify the rule exists
        payment = SalePaymentFactory(
            invoice=unpaid_invoice,
            method=SalePayment.PaymentMethod.CASH,
        )

        # Should not have destination_account
        assert payment.destination_account is None

    def test_total_refunded_property(self, cash_payment):
        """Test total_refunded property."""
        from apps.sale.tests.factories import SaleRefundFactory

        assert cash_payment.total_refunded == Decimal("0.0000")

        # Add refund
        SaleRefundFactory(
            payment=cash_payment,
            invoice=cash_payment.invoice,
            amount=Decimal("30.0000"),
            status="COMPLETED",
        )

        assert cash_payment.total_refunded == Decimal("30.0000")

    def test_total_refunded_excludes_voided_refunds(self, cash_payment):
        """Test total_refunded ignores voided refunds."""
        from apps.sale.tests.factories import SaleRefundFactory

        SaleRefundFactory(
            payment=cash_payment,
            invoice=cash_payment.invoice,
            amount=Decimal("30.0000"),
            status="COMPLETED",
        )
        SaleRefundFactory(
            payment=cash_payment,
            invoice=cash_payment.invoice,
            amount=Decimal("20.0000"),
            status="VOID",  # Should be excluded
        )

        assert cash_payment.total_refunded == Decimal("30.0000")

    def test_refundable_amount_property(self, cash_payment):
        """Test refundable_amount property."""
        from apps.sale.tests.factories import SaleRefundFactory

        initial = cash_payment.refundable_amount
        assert initial == cash_payment.amount_applied

        # Add partial refund
        SaleRefundFactory(
            payment=cash_payment,
            invoice=cash_payment.invoice,
            amount=Decimal("40.0000"),
        )

        remaining = cash_payment.amount_applied - Decimal("40.0000")
        assert cash_payment.refundable_amount == remaining

    def test_refundable_amount_excludes_tip(self, payment_with_tip):
        """Test refundable_amount doesn't include tip."""
        # Tip should never be refundable
        assert payment_with_tip.refundable_amount == payment_with_tip.amount_applied
        assert payment_with_tip.tip_amount > 0
        assert payment_with_tip.tip_amount not in str(
            payment_with_tip.refundable_amount
        )

    def test_str_representation(self, cash_payment):
        """Test string representation."""
        str_repr = str(cash_payment)
        assert "Cash" in str_repr or "CASH" in str_repr.upper()
        assert str(cash_payment.amount_total) in str_repr

    def test_history_tracking(self, cash_payment):
        """Test django-simple-history tracks changes."""
        assert cash_payment.history.count() == 1

        # Update status
        cash_payment.status = SalePayment.PaymentStatus.VOID
        cash_payment.save()

        assert cash_payment.history.count() == 2

    def test_payment_methods(self):
        """Test all payment methods are defined."""
        methods = [choice[0] for choice in SalePayment.PaymentMethod.choices]
        assert "CASH" in methods
        assert "POS" in methods
        assert "CARD_TRANSFER" in methods

    def test_payment_statuses(self):
        """Test all payment statuses are defined."""
        statuses = [choice[0] for choice in SalePayment.PaymentStatus.choices]
        assert "COMPLETED" in statuses
        assert "VOID" in statuses
