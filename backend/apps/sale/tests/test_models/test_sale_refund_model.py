"""
Tests for SaleRefund model.
"""

from decimal import Decimal

import pytest
from apps.sale.models import SaleRefund
from apps.sale.tests.factories import SaleRefundFactory, SalePaymentFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestSaleRefundModel:
    """Test suite for SaleRefund model."""

    def test_create_refund(self, cash_payment, staff_with_perms):
        """Test creating a basic refund."""
        refund = SaleRefundFactory(
            payment=cash_payment,
            invoice=cash_payment.invoice,
            amount=Decimal("50.0000"),
            processed_by=staff_with_perms,
            reason="Customer request",
        )

        assert refund.pk is not None
        assert refund.payment == cash_payment
        assert refund.invoice == cash_payment.invoice
        assert refund.amount == Decimal("50.0000")
        assert refund.status == SaleRefund.Status.COMPLETED

    def test_clean_validates_positive_amount(self, cash_payment):
        """Test clean() rejects zero or negative amounts."""
        refund = SaleRefundFactory.build(
            payment=cash_payment,
            invoice=cash_payment.invoice,
            amount=Decimal("0.0000"),
        )

        with pytest.raises(ValidationError) as exc_info:
            refund.clean()

        assert "must be positive" in str(exc_info.value)

        # Test negative
        refund.amount = Decimal("-10.0000")
        with pytest.raises(ValidationError):
            refund.clean()

    def test_clean_validates_refund_doesnt_exceed_payment(self, cash_payment):
        """Test clean() prevents refunds exceeding payment amount."""
        # Create refund larger than payment
        refund = SaleRefundFactory.build(
            payment=cash_payment,
            invoice=cash_payment.invoice,
            amount=cash_payment.amount_applied + Decimal("10.0000"),
        )

        with pytest.raises(ValidationError) as exc_info:
            refund.clean()

        assert "exceed payment amount" in str(exc_info.value)

    def test_clean_validates_multiple_partial_refunds(self, cash_payment):
        """Test clean() validates total refunds don't exceed payment."""
        # Create first refund
        SaleRefundFactory(
            payment=cash_payment,
            invoice=cash_payment.invoice,
            amount=Decimal("60.0000"),
        )

        # Try to create second refund that would exceed payment
        refund2 = SaleRefundFactory.build(
            payment=cash_payment,
            invoice=cash_payment.invoice,
            amount=Decimal("50.0000"),  # Total would be 110, but payment is 100
        )

        with pytest.raises(ValidationError) as exc_info:
            refund2.clean()

        assert "exceed payment amount" in str(exc_info.value)

    def test_clean_allows_multiple_partial_refunds_within_limit(self, cash_payment):
        """Test clean() allows multiple refunds within payment amount."""
        # Create first refund
        refund1 = SaleRefundFactory(
            payment=cash_payment,
            invoice=cash_payment.invoice,
            amount=Decimal("40.0000"),
        )

        # Create second refund within limits
        refund2 = SaleRefundFactory.build(
            payment=cash_payment,
            invoice=cash_payment.invoice,
            amount=Decimal("30.0000"),  # Total: 70, payment: 100 ✓
        )

        # Should not raise
        refund2.clean()

    def test_clean_validates_invoice_matches_payment(
        self, cash_payment, unpaid_invoice
    ):
        """Test clean() ensures refund invoice matches payment invoice."""
        # Try to create refund with mismatched invoice
        refund = SaleRefundFactory.build(
            payment=cash_payment,
            invoice=unpaid_invoice,  # Different invoice!
        )

        if cash_payment.invoice != unpaid_invoice:
            with pytest.raises(ValidationError) as exc_info:
                refund.clean()

            assert "must match payment invoice" in str(exc_info.value)

    def test_refund_methods(self):
        """Test all refund methods are defined."""
        methods = [choice[0] for choice in SaleRefund.Method.choices]
        assert "CASH" in methods
        assert "POS" in methods
        assert "CARD_TRANSFER" in methods

    def test_refund_statuses(self):
        """Test all refund statuses are defined."""
        statuses = [choice[0] for choice in SaleRefund.Status.choices]
        assert "COMPLETED" in statuses
        assert "VOID" in statuses

    def test_str_representation(self, refund):
        """Test string representation."""
        str_repr = str(refund)
        assert str(refund.amount) in str_repr
        assert str(refund.payment_id) in str_repr

    def test_history_tracking(self, refund):
        """Test django-simple-history tracks changes."""
        assert refund.history.count() == 1

        # Update status
        refund.status = SaleRefund.Status.VOID
        refund.save()

        assert refund.history.count() == 2

    def test_refund_can_use_different_method_than_payment(self, cash_payment):
        """Test refund method can differ from payment method."""
        refund = SaleRefundFactory(
            payment=cash_payment,
            invoice=cash_payment.invoice,
            amount=Decimal("50.0000"),
            method=SaleRefund.Method.POS,  # Different from CASH payment
        )

        assert refund.method != cash_payment.method
        assert refund.pk is not None  # Successfully created

    def test_refund_reason_optional(self, cash_payment):
        """Test reason field is optional."""
        refund = SaleRefundFactory(
            payment=cash_payment,
            invoice=cash_payment.invoice,
            amount=Decimal("50.0000"),
            reason="",  # Empty reason
        )

        assert refund.reason == ""
        assert refund.pk is not None
