"""
Tests for IssuePaymentService.
"""

from decimal import Decimal

import pytest
from apps.sale.models import SaleInvoice, SalePayment
from apps.sale.services.invoice.issue_payment_service import IssuePaymentService
from apps.sale.tests.factories import SaleInvoiceFactory
from django.core.exceptions import PermissionDenied, ValidationError


@pytest.mark.django_db
class TestIssuePaymentService:
    """Test suite for IssuePaymentService."""

    def test_issue_payment_success(self, unpaid_invoice, staff_with_perms):
        """Test successfully issuing a payment."""
        payment = IssuePaymentService.execute(
            invoice=unpaid_invoice,
            received_by=staff_with_perms,
            method=SalePayment.PaymentMethod.CASH,
            amount_applied=Decimal("100.0000"),
        )

        assert payment.pk is not None
        assert payment.invoice == unpaid_invoice
        assert payment.method == SalePayment.PaymentMethod.CASH
        assert payment.amount_applied == Decimal("100.0000")
        assert payment.amount_total == Decimal("100.0000")
        assert payment.status == SalePayment.PaymentStatus.COMPLETED

    def test_issue_payment_with_tip(self, unpaid_invoice, staff_with_perms):
        """Test issuing payment with tip."""
        payment = IssuePaymentService.execute(
            invoice=unpaid_invoice,
            received_by=staff_with_perms,
            method=SalePayment.PaymentMethod.CASH,
            amount_applied=Decimal("100.0000"),
            tip_amount=Decimal("10.0000"),
        )

        assert payment.amount_applied == Decimal("100.0000")
        assert payment.tip_amount == Decimal("10.0000")
        assert payment.amount_total == Decimal("110.0000")

    def test_invoice_status_updated_to_partially_paid(
        self, unpaid_invoice, staff_with_perms
    ):
        """Test invoice status updates to PARTIALLY_PAID."""
        # Set invoice total
        unpaid_invoice.total_amount = Decimal("200.0000")
        unpaid_invoice.save()

        # Pay half
        IssuePaymentService.execute(
            invoice=unpaid_invoice,
            received_by=staff_with_perms,
            method=SalePayment.PaymentMethod.CASH,
            amount_applied=Decimal("100.0000"),
        )

        unpaid_invoice.refresh_from_db()
        assert unpaid_invoice.status == SaleInvoice.InvoiceStatus.PARTIALLY_PAID

    def test_invoice_status_updated_to_paid(
        self, unpaid_invoice, staff_with_perms
    ):
        """Test invoice status updates to PAID when fully paid."""
        # Pay full amount
        IssuePaymentService.execute(
            invoice=unpaid_invoice,
            received_by=staff_with_perms,
            method=SalePayment.PaymentMethod.CASH,
            amount_applied=unpaid_invoice.total_amount,
        )

        unpaid_invoice.refresh_from_db()
        assert unpaid_invoice.status == SaleInvoice.InvoiceStatus.PAID

    def test_multiple_partial_payments(self, unpaid_invoice, staff_with_perms):
        """Test multiple partial payments update status correctly."""
        unpaid_invoice.total_amount = Decimal("300.0000")
        unpaid_invoice.save()

        # First payment
        IssuePaymentService.execute(
            invoice=unpaid_invoice,
            received_by=staff_with_perms,
            method=SalePayment.PaymentMethod.CASH,
            amount_applied=Decimal("100.0000"),
        )

        unpaid_invoice.refresh_from_db()
        assert unpaid_invoice.status == SaleInvoice.InvoiceStatus.PARTIALLY_PAID

        # Second payment
        IssuePaymentService.execute(
            invoice=unpaid_invoice,
            received_by=staff_with_perms,
            method=SalePayment.PaymentMethod.CASH,
            amount_applied=Decimal("100.0000"),
        )

        unpaid_invoice.refresh_from_db()
        assert unpaid_invoice.status == SaleInvoice.InvoiceStatus.PARTIALLY_PAID

        # Final payment
        IssuePaymentService.execute(
            invoice=unpaid_invoice,
            received_by=staff_with_perms,
            method=SalePayment.PaymentMethod.CASH,
            amount_applied=Decimal("100.0000"),
        )

        unpaid_invoice.refresh_from_db()
        assert unpaid_invoice.status == SaleInvoice.InvoiceStatus.PAID

    def test_overpayment_allowed(self, unpaid_invoice, staff_with_perms):
        """Test overpayment is allowed."""
        unpaid_invoice.total_amount = Decimal("100.0000")
        unpaid_invoice.save()

        # Pay more than invoice total
        payment = IssuePaymentService.execute(
            invoice=unpaid_invoice,
            received_by=staff_with_perms,
            method=SalePayment.PaymentMethod.CASH,
            amount_applied=Decimal("150.0000"),
        )

        assert payment.amount_applied == Decimal("150.0000")

        unpaid_invoice.refresh_from_db()
        assert unpaid_invoice.status == SaleInvoice.InvoiceStatus.PAID

    def test_fails_for_void_invoice(self, staff_with_perms):
        """Test payment fails for voided invoice."""
        void_invoice = SaleInvoiceFactory(status=SaleInvoice.InvoiceStatus.VOID)

        with pytest.raises(ValidationError) as exc_info:
            IssuePaymentService.execute(
                invoice=void_invoice,
                received_by=staff_with_perms,
                method=SalePayment.PaymentMethod.CASH,
                amount_applied=Decimal("100.0000"),
            )

        assert "void" in str(exc_info.value).lower()

    def test_fails_for_zero_amount(self, unpaid_invoice, staff_with_perms):
        """Test payment fails for zero amount."""
        with pytest.raises(ValidationError) as exc_info:
            IssuePaymentService.execute(
                invoice=unpaid_invoice,
                received_by=staff_with_perms,
                method=SalePayment.PaymentMethod.CASH,
                amount_applied=Decimal("0.0000"),
            )

        assert "must be positive" in str(exc_info.value)

    def test_fails_for_negative_amount(self, unpaid_invoice, staff_with_perms):
        """Test payment fails for negative amount."""
        with pytest.raises(ValidationError):
            IssuePaymentService.execute(
                invoice=unpaid_invoice,
                received_by=staff_with_perms,
                method=SalePayment.PaymentMethod.CASH,
                amount_applied=Decimal("-50.0000"),
            )

    def test_fails_for_negative_tip(self, unpaid_invoice, staff_with_perms):
        """Test payment fails for negative tip."""
        with pytest.raises(ValidationError) as exc_info:
            IssuePaymentService.execute(
                invoice=unpaid_invoice,
                received_by=staff_with_perms,
                method=SalePayment.PaymentMethod.CASH,
                amount_applied=Decimal("100.0000"),
                tip_amount=Decimal("-5.0000"),
            )

        assert "cannot be negative" in str(exc_info.value)

    def test_fails_without_permission(self, unpaid_invoice, non_staff_user):
        """Test payment fails without permission."""
        with pytest.raises(PermissionDenied):
            IssuePaymentService.execute(
                invoice=unpaid_invoice,
                received_by=non_staff_user,
                method=SalePayment.PaymentMethod.CASH,
                amount_applied=Decimal("100.0000"),
            )

    def test_atomic_transaction(self, unpaid_invoice, staff_with_perms):
        """Test service runs in atomic transaction."""
        from unittest.mock import patch

        initial_payment_count = SalePayment.objects.count()

        # Mock to raise error during execution
        with patch.object(
            IssuePaymentService, "_update_invoice_status", side_effect=Exception("Test")
        ):
            with pytest.raises(Exception):
                IssuePaymentService.execute(
                    invoice=unpaid_invoice,
                    received_by=staff_with_perms,
                    method=SalePayment.PaymentMethod.CASH,
                    amount_applied=Decimal("100.0000"),
                )

        # Verify no payment was created (transaction rolled back)
        assert SalePayment.objects.count() == initial_payment_count

    def test_payment_methods_supported(self, unpaid_invoice, staff_with_perms):
        """Test all payment methods are supported."""
        for method in SalePayment.PaymentMethod.values:
            payment = IssuePaymentService.execute(
                invoice=unpaid_invoice,
                received_by=staff_with_perms,
                method=method,
                amount_applied=Decimal("10.0000"),
            )
            assert payment.method == method

    def test_zero_tip_allowed(self, unpaid_invoice, staff_with_perms):
        """Test payment with zero tip is allowed."""
        payment = IssuePaymentService.execute(
            invoice=unpaid_invoice,
            received_by=staff_with_perms,
            method=SalePayment.PaymentMethod.CASH,
            amount_applied=Decimal("100.0000"),
            tip_amount=Decimal("0.0000"),
        )

        assert payment.tip_amount == Decimal("0.0000")
        assert payment.amount_total == payment.amount_applied

    def test_status_remains_unpaid_if_zero_payments(
        self, unpaid_invoice, staff_with_perms
    ):
        """Test invoice remains unpaid if all payments are voided."""
        # Create payment then void it
        payment = IssuePaymentService.execute(
            invoice=unpaid_invoice,
            received_by=staff_with_perms,
            method=SalePayment.PaymentMethod.CASH,
            amount_applied=Decimal("100.0000"),
        )

        payment.status = SalePayment.PaymentStatus.VOID
        payment.save()

        # Manually trigger status update
        IssuePaymentService._update_invoice_status(unpaid_invoice)

        unpaid_invoice.refresh_from_db()
        assert unpaid_invoice.status == SaleInvoice.InvoiceStatus.UNPAID
