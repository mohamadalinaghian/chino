"""
Tests for SaleInvoice model.
"""

from decimal import Decimal

import pytest
from apps.sale.models import SaleInvoice
from apps.sale.tests.factories import SaleInvoiceFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestSaleInvoiceModel:
    """Test suite for SaleInvoice model."""

    def test_create_invoice(self, closed_sale, staff_with_perms):
        """Test creating a basic invoice."""
        invoice = SaleInvoiceFactory(
            sale=closed_sale,
            issued_by=staff_with_perms,
            subtotal_amount=Decimal("100.0000"),
            total_amount=Decimal("100.0000"),
        )

        assert invoice.pk is not None
        assert invoice.sale == closed_sale
        assert invoice.issued_by == staff_with_perms
        assert invoice.status == SaleInvoice.InvoiceStatus.UNPAID

    def test_invoice_number_unique(self, closed_sale, staff_with_perms):
        """Test invoice numbers are unique."""
        SaleInvoiceFactory(invoice_number="INV-2025-000001")

        with pytest.raises(Exception):  # IntegrityError
            SaleInvoiceFactory(invoice_number="INV-2025-000001")

    def test_invoice_calculation_validation(self, closed_sale, staff_with_perms):
        """Test invoice validates calculation correctness."""
        invoice = SaleInvoiceFactory(
            sale=closed_sale,
            issued_by=staff_with_perms,
            subtotal_amount=Decimal("100.0000"),
            discount_amount=Decimal("10.0000"),
            tax_amount=Decimal("9.0000"),
            total_amount=Decimal("99.0000"),  # Correct: 100 - 10 + 9
        )

        # Should not raise
        invoice.clean()

    def test_invoice_calculation_validation_fails(self, closed_sale, staff_with_perms):
        """Test invoice clean() rejects incorrect totals."""
        invoice = SaleInvoiceFactory.build(
            sale=closed_sale,
            issued_by=staff_with_perms,
            subtotal_amount=Decimal("100.0000"),
            discount_amount=Decimal("10.0000"),
            tax_amount=Decimal("9.0000"),
            total_amount=Decimal("150.0000"),  # Wrong!
        )

        with pytest.raises(ValidationError) as exc_info:
            invoice.clean()

        assert "doesn't match calculation" in str(exc_info.value)

    def test_negative_subtotal_validation(self, closed_sale, staff_with_perms):
        """Test invoice rejects negative subtotal."""
        invoice = SaleInvoiceFactory.build(
            sale=closed_sale,
            subtotal_amount=Decimal("-100.0000"),
            total_amount=Decimal("-100.0000"),
        )

        with pytest.raises(ValidationError) as exc_info:
            invoice.clean()

        assert "Subtotal cannot be negative" in str(exc_info.value)

    def test_negative_discount_validation(self, closed_sale, staff_with_perms):
        """Test invoice rejects negative discount."""
        invoice = SaleInvoiceFactory.build(
            sale=closed_sale,
            discount_amount=Decimal("-10.0000"),
        )

        with pytest.raises(ValidationError):
            invoice.clean()

    def test_negative_tax_validation(self, closed_sale, staff_with_perms):
        """Test invoice rejects negative tax."""
        invoice = SaleInvoiceFactory.build(
            sale=closed_sale,
            tax_amount=Decimal("-5.0000"),
        )

        with pytest.raises(ValidationError):
            invoice.clean()

    def test_total_paid_property(self, unpaid_invoice):
        """Test total_paid property calculates correctly."""
        from apps.sale.tests.factories import SalePaymentFactory

        assert unpaid_invoice.total_paid == Decimal("0.0000")

        # Add payment
        SalePaymentFactory(
            invoice=unpaid_invoice,
            amount_applied=Decimal("50.0000"),
            amount_total=Decimal("50.0000"),
            status="COMPLETED",
        )

        assert unpaid_invoice.total_paid == Decimal("50.0000")

    def test_total_paid_excludes_voided_payments(self, unpaid_invoice):
        """Test total_paid ignores voided payments."""
        from apps.sale.tests.factories import SalePaymentFactory

        SalePaymentFactory(
            invoice=unpaid_invoice,
            amount_applied=Decimal("50.0000"),
            status="COMPLETED",
        )
        SalePaymentFactory(
            invoice=unpaid_invoice,
            amount_applied=Decimal("30.0000"),
            status="VOID",  # Should be excluded
        )

        assert unpaid_invoice.total_paid == Decimal("50.0000")

    def test_balance_due_property(self, unpaid_invoice):
        """Test balance_due property calculates correctly."""
        from apps.sale.tests.factories import SalePaymentFactory

        invoice_total = unpaid_invoice.total_amount
        assert unpaid_invoice.balance_due == invoice_total

        # Add partial payment
        SalePaymentFactory(
            invoice=unpaid_invoice,
            amount_applied=Decimal("100.0000"),
            amount_total=Decimal("100.0000"),
        )

        expected_balance = invoice_total - Decimal("100.0000")
        assert unpaid_invoice.balance_due == expected_balance

    def test_is_fully_paid_property(self, unpaid_invoice):
        """Test is_fully_paid property."""
        from apps.sale.tests.factories import SalePaymentFactory

        assert unpaid_invoice.is_fully_paid is False

        # Pay full amount
        SalePaymentFactory(
            invoice=unpaid_invoice,
            amount_applied=unpaid_invoice.total_amount,
            amount_total=unpaid_invoice.total_amount,
        )

        assert unpaid_invoice.is_fully_paid is True

    def test_is_fully_paid_with_tolerance(self, unpaid_invoice):
        """Test is_fully_paid handles small differences (tolerance)."""
        from apps.sale.tests.factories import SalePaymentFactory

        # Pay slightly less (within tolerance)
        payment_amount = unpaid_invoice.total_amount - Decimal("0.005")
        SalePaymentFactory(
            invoice=unpaid_invoice,
            amount_applied=payment_amount,
            amount_total=payment_amount,
        )

        assert unpaid_invoice.is_fully_paid is True

    def test_str_representation(self, unpaid_invoice):
        """Test string representation."""
        str_repr = str(unpaid_invoice)
        assert unpaid_invoice.invoice_number in str_repr
        assert str(unpaid_invoice.sale_id) in str_repr

    def test_history_tracking(self, unpaid_invoice):
        """Test django-simple-history tracks changes."""
        # Initial state
        assert unpaid_invoice.history.count() == 1

        # Update status
        unpaid_invoice.status = SaleInvoice.InvoiceStatus.PAID
        unpaid_invoice.save()

        # Should have 2 history records
        assert unpaid_invoice.history.count() == 2

        # Check history
        latest = unpaid_invoice.history.first()
        assert latest.status == SaleInvoice.InvoiceStatus.PAID

    def test_ordering(self, closed_sale, staff_with_perms):
        """Test invoices ordered by issued_at descending."""
        import datetime

        from django.utils import timezone

        invoice1 = SaleInvoiceFactory(
            invoice_number="INV-1",
            issued_at=timezone.now() - datetime.timedelta(days=2),
        )
        invoice2 = SaleInvoiceFactory(
            invoice_number="INV-2",
            issued_at=timezone.now() - datetime.timedelta(days=1),
        )
        invoice3 = SaleInvoiceFactory(
            invoice_number="INV-3",
            issued_at=timezone.now(),
        )

        invoices = list(SaleInvoice.objects.all())
        assert invoices[0] == invoice3  # Most recent first
        assert invoices[1] == invoice2
        assert invoices[2] == invoice1
