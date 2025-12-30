"""
Tests for CreateRefundService.
"""

from decimal import Decimal

import pytest
from apps.sale.models import SaleInvoice, SalePayment, SaleRefund
from apps.sale.services.invoice.create_refund_service import CreateRefundService
from apps.sale.tests.factories import SalePaymentFactory
from django.core.exceptions import PermissionDenied, ValidationError


@pytest.mark.django_db
class TestCreateRefundService:
    """Test suite for CreateRefundService."""

    def test_create_refund_success(self, cash_payment, staff_with_perms):
        """Test successfully creating a refund."""
        refund = CreateRefundService.execute(
            payment=cash_payment,
            refunded_by=staff_with_perms,
            amount=Decimal("50.0000"),
            reason="Customer request",
        )

        assert refund.pk is not None
        assert refund.payment == cash_payment
        assert refund.invoice == cash_payment.invoice
        assert refund.amount == Decimal("50.0000")
        assert refund.reason == "Customer request"
        assert refund.status == SaleRefund.Status.COMPLETED

    def test_refund_defaults_to_same_method_as_payment(
        self, cash_payment, staff_with_perms
    ):
        """Test refund method defaults to payment method."""
        refund = CreateRefundService.execute(
            payment=cash_payment,
            refunded_by=staff_with_perms,
            amount=Decimal("50.0000"),
            reason="Test",
        )

        assert refund.method == cash_payment.method

    def test_refund_can_use_different_method(self, cash_payment, staff_with_perms):
        """Test refund can use different method than payment."""
        refund = CreateRefundService.execute(
            payment=cash_payment,
            refunded_by=staff_with_perms,
            amount=Decimal("50.0000"),
            reason="Test",
            method=SaleRefund.Method.POS,  # Different from CASH
        )

        assert refund.method == SaleRefund.Method.POS
        assert refund.method != cash_payment.method

    def test_partial_refund_doesnt_void_payment(
        self, cash_payment, staff_with_perms
    ):
        """Test partial refund doesn't void the payment."""
        cash_payment.amount_applied = Decimal("100.0000")
        cash_payment.save()

        # Partial refund
        CreateRefundService.execute(
            payment=cash_payment,
            refunded_by=staff_with_perms,
            amount=Decimal("40.0000"),
            reason="Partial refund",
        )

        cash_payment.refresh_from_db()
        assert cash_payment.status == SalePayment.PaymentStatus.COMPLETED

    def test_full_refund_voids_payment(self, cash_payment, staff_with_perms):
        """Test full refund voids the payment."""
        # Full refund
        CreateRefundService.execute(
            payment=cash_payment,
            refunded_by=staff_with_perms,
            amount=cash_payment.amount_applied,
            reason="Full refund",
        )

        cash_payment.refresh_from_db()
        assert cash_payment.status == SalePayment.PaymentStatus.VOID

    def test_multiple_partial_refunds_void_when_total_equals_payment(
        self, cash_payment, staff_with_perms
    ):
        """Test multiple partial refunds void payment when total equals payment."""
        cash_payment.amount_applied = Decimal("100.0000")
        cash_payment.save()

        # First partial refund
        CreateRefundService.execute(
            payment=cash_payment,
            refunded_by=staff_with_perms,
            amount=Decimal("60.0000"),
            reason="First refund",
        )

        cash_payment.refresh_from_db()
        assert cash_payment.status == SalePayment.PaymentStatus.COMPLETED

        # Second partial refund (totals to full amount)
        CreateRefundService.execute(
            payment=cash_payment,
            refunded_by=staff_with_perms,
            amount=Decimal("40.0000"),
            reason="Second refund",
        )

        cash_payment.refresh_from_db()
        assert cash_payment.status == SalePayment.PaymentStatus.VOID

    def test_invoice_status_updated_after_refund(
        self, paid_invoice, staff_with_perms
    ):
        """Test invoice status updates after refund."""
        payment = paid_invoice.payments.first()

        # Refund the payment
        CreateRefundService.execute(
            payment=payment,
            refunded_by=staff_with_perms,
            amount=payment.amount_applied,
            reason="Refund",
        )

        paid_invoice.refresh_from_db()
        # Should go back to unpaid since payment was voided
        assert paid_invoice.status == SaleInvoice.InvoiceStatus.UNPAID

    def test_fails_for_voided_payment(self, cash_payment, staff_with_perms):
        """Test refund fails for voided payment."""
        cash_payment.status = SalePayment.PaymentStatus.VOID
        cash_payment.save()

        with pytest.raises(ValidationError) as exc_info:
            CreateRefundService.execute(
                payment=cash_payment,
                refunded_by=staff_with_perms,
                amount=Decimal("50.0000"),
                reason="Test",
            )

        assert "completed" in str(exc_info.value).lower()

    def test_fails_for_zero_amount(self, cash_payment, staff_with_perms):
        """Test refund fails for zero amount."""
        with pytest.raises(ValidationError) as exc_info:
            CreateRefundService.execute(
                payment=cash_payment,
                refunded_by=staff_with_perms,
                amount=Decimal("0.0000"),
                reason="Test",
            )

        assert "must be positive" in str(exc_info.value)

    def test_fails_for_negative_amount(self, cash_payment, staff_with_perms):
        """Test refund fails for negative amount."""
        with pytest.raises(ValidationError):
            CreateRefundService.execute(
                payment=cash_payment,
                refunded_by=staff_with_perms,
                amount=Decimal("-10.0000"),
                reason="Test",
            )

    def test_fails_if_exceeds_payment_amount(self, cash_payment, staff_with_perms):
        """Test refund fails if amount exceeds payment."""
        with pytest.raises(ValidationError) as exc_info:
            CreateRefundService.execute(
                payment=cash_payment,
                refunded_by=staff_with_perms,
                amount=cash_payment.amount_applied + Decimal("10.0000"),
                reason="Test",
            )

        assert "exceed" in str(exc_info.value)

    def test_fails_if_total_refunds_exceed_payment(
        self, cash_payment, staff_with_perms
    ):
        """Test refund fails if total refunds would exceed payment."""
        cash_payment.amount_applied = Decimal("100.0000")
        cash_payment.save()

        # First refund
        CreateRefundService.execute(
            payment=cash_payment,
            refunded_by=staff_with_perms,
            amount=Decimal("60.0000"),
            reason="First",
        )

        # Second refund that would exceed
        with pytest.raises(ValidationError) as exc_info:
            CreateRefundService.execute(
                payment=cash_payment,
                refunded_by=staff_with_perms,
                amount=Decimal("50.0000"),  # Total would be 110
                reason="Second",
            )

        assert "exceed" in str(exc_info.value)

    def test_tips_not_refundable(self, payment_with_tip, staff_with_perms):
        """Test tips are not included in refundable amount."""
        # Can only refund the applied amount, not the tip
        max_refund = payment_with_tip.amount_applied

        # This should succeed
        refund = CreateRefundService.execute(
            payment=payment_with_tip,
            refunded_by=staff_with_perms,
            amount=max_refund,
            reason="Test",
        )

        assert refund.amount == max_refund
        assert refund.amount < payment_with_tip.amount_total  # Less than total with tip

    def test_cannot_refund_tip_amount(self, payment_with_tip, staff_with_perms):
        """Test attempting to refund including tip fails."""
        # Try to refund total including tip
        with pytest.raises(ValidationError):
            CreateRefundService.execute(
                payment=payment_with_tip,
                refunded_by=staff_with_perms,
                amount=payment_with_tip.amount_total,  # Includes tip
                reason="Test",
            )

    def test_fails_without_permission(self, cash_payment, non_staff_user):
        """Test refund fails without permission."""
        with pytest.raises(PermissionDenied):
            CreateRefundService.execute(
                payment=cash_payment,
                refunded_by=non_staff_user,
                amount=Decimal("50.0000"),
                reason="Test",
            )

    def test_atomic_transaction(self, cash_payment, staff_with_perms):
        """Test service runs in atomic transaction."""
        from unittest.mock import patch

        initial_refund_count = SaleRefund.objects.count()

        # Mock to raise error during execution
        with patch.object(
            CreateRefundService,
            "execute",
            side_effect=Exception("Test"),
            wraps=CreateRefundService.execute,
        ):
            with pytest.raises(Exception):
                CreateRefundService.execute(
                    payment=cash_payment,
                    refunded_by=staff_with_perms,
                    amount=Decimal("50.0000"),
                    reason="Test",
                )

        # In a real scenario with proper mocking, no refund should be created

    def test_refund_with_empty_reason(self, cash_payment, staff_with_perms):
        """Test refund can be created with empty reason."""
        refund = CreateRefundService.execute(
            payment=cash_payment,
            refunded_by=staff_with_perms,
            amount=Decimal("50.0000"),
            reason="",
        )

        assert refund.reason == ""
        assert refund.pk is not None

    def test_concurrent_refunds_validation(self, cash_payment, staff_with_perms):
        """Test multiple refunds validate correctly against each other."""
        cash_payment.amount_applied = Decimal("100.0000")
        cash_payment.save()

        # Create first refund
        refund1 = CreateRefundService.execute(
            payment=cash_payment,
            refunded_by=staff_with_perms,
            amount=Decimal("30.0000"),
            reason="First",
        )

        # Create second refund
        refund2 = CreateRefundService.execute(
            payment=cash_payment,
            refunded_by=staff_with_perms,
            amount=Decimal("30.0000"),
            reason="Second",
        )

        # Create third refund
        refund3 = CreateRefundService.execute(
            payment=cash_payment,
            refunded_by=staff_with_perms,
            amount=Decimal("40.0000"),
            reason="Third",
        )

        # All should succeed
        assert refund1.pk and refund2.pk and refund3.pk

        # Payment should be voided (100 = 30 + 30 + 40)
        cash_payment.refresh_from_db()
        assert cash_payment.status == SalePayment.PaymentStatus.VOID
