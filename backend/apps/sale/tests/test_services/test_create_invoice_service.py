"""
Tests for CreateInvoiceService.
"""

from decimal import Decimal

import pytest
from apps.sale.models import Sale, SaleInvoice
from apps.sale.services.invoice.create_invoice_service import CreateInvoiceService
from apps.sale.tests.factories import SaleFactory
from django.core.exceptions import PermissionDenied


@pytest.mark.django_db
class TestCreateInvoiceService:
    """Test suite for CreateInvoiceService."""

    def test_create_invoice_success(self, closed_sale, staff_with_perms):
        """Test successfully creating an invoice for a closed sale."""
        invoice = CreateInvoiceService.execute(
            sale=closed_sale,
            issued_by=staff_with_perms,
            tax_amount=Decimal("13.5000"),
        )

        assert invoice.pk is not None
        assert invoice.sale == closed_sale
        assert invoice.issued_by == staff_with_perms
        assert invoice.status == SaleInvoice.InvoiceStatus.UNPAID
        assert invoice.invoice_number is not None

    def test_invoice_number_auto_generated(self, closed_sale, staff_with_perms):
        """Test invoice number is auto-generated."""
        invoice = CreateInvoiceService.execute(
            sale=closed_sale,
            issued_by=staff_with_perms,
        )

        assert invoice.invoice_number.startswith("INV-")
        assert len(invoice.invoice_number) > 10

    def test_invoice_number_custom(self, closed_sale, staff_with_perms):
        """Test custom invoice number can be provided."""
        invoice = CreateInvoiceService.execute(
            sale=closed_sale,
            issued_by=staff_with_perms,
            invoice_number="CUSTOM-001",
        )

        assert invoice.invoice_number == "CUSTOM-001"

    def test_invoice_sequential_numbering(self, staff_with_perms):
        """Test invoice numbers are sequential."""
        sale1 = SaleFactory(state=Sale.State.CLOSED, opened_by=staff_with_perms)
        sale2 = SaleFactory(state=Sale.State.CLOSED, opened_by=staff_with_perms)

        invoice1 = CreateInvoiceService.execute(
            sale=sale1,
            issued_by=staff_with_perms,
        )
        invoice2 = CreateInvoiceService.execute(
            sale=sale2,
            issued_by=staff_with_perms,
        )

        # Extract sequence numbers
        seq1 = int(invoice1.invoice_number.split("-")[-1])
        seq2 = int(invoice2.invoice_number.split("-")[-1])

        assert seq2 == seq1 + 1

    def test_totals_calculated_correctly(self, closed_sale, staff_with_perms):
        """Test invoice totals are calculated correctly."""
        # Set sale total
        closed_sale.total_amount = Decimal("100.0000")
        closed_sale.save()

        invoice = CreateInvoiceService.execute(
            sale=closed_sale,
            issued_by=staff_with_perms,
            tax_amount=Decimal("9.0000"),
        )

        assert invoice.subtotal_amount == Decimal("100.0000")
        assert invoice.tax_amount == Decimal("9.0000")
        assert invoice.total_amount == Decimal("109.0000")

    def test_discounts_included_in_calculation(self, closed_sale, staff_with_perms):
        """Test discounts are included in invoice calculation."""
        from apps.sale.models import SaleDiscount

        # Add discount to sale
        SaleDiscount.objects.create(
            sale=closed_sale,
            discount_type=SaleDiscount.DiscountType.FIXED,
            value=Decimal("10.00"),
            reason="Loyalty discount",
            applied_by=staff_with_perms,
        )

        closed_sale.total_amount = Decimal("100.0000")
        closed_sale.save()

        invoice = CreateInvoiceService.execute(
            sale=closed_sale,
            issued_by=staff_with_perms,
            tax_amount=Decimal("8.1000"),  # 9% of (100-10)
        )

        assert invoice.discount_amount == Decimal("10.00")
        # Total = subtotal - discount + tax = 100 - 10 + 8.1
        assert invoice.total_amount == Decimal("98.1000")

    def test_fails_for_open_sale(self, open_sale, staff_with_perms):
        """Test creating invoice fails for open sale."""
        with pytest.raises(PermissionDenied) as exc_info:
            CreateInvoiceService.execute(
                sale=open_sale,
                issued_by=staff_with_perms,
            )

        assert "CLOSED" in str(exc_info.value)

    def test_fails_for_cancelled_sale(self, staff_with_perms):
        """Test creating invoice fails for cancelled sale."""
        cancelled_sale = SaleFactory(
            state=Sale.State.CANCELED,
            opened_by=staff_with_perms,
        )

        with pytest.raises(PermissionDenied):
            CreateInvoiceService.execute(
                sale=cancelled_sale,
                issued_by=staff_with_perms,
            )

    def test_fails_if_invoice_already_exists(self, closed_sale, staff_with_perms):
        """Test creating invoice fails if one already exists."""
        # Create first invoice
        CreateInvoiceService.execute(
            sale=closed_sale,
            issued_by=staff_with_perms,
        )

        # Try to create second invoice
        with pytest.raises(PermissionDenied) as exc_info:
            CreateInvoiceService.execute(
                sale=closed_sale,
                issued_by=staff_with_perms,
            )

        assert "already exists" in str(exc_info.value)

    def test_fails_without_permission(self, closed_sale, non_staff_user):
        """Test creating invoice fails without permission."""
        with pytest.raises(PermissionDenied):
            CreateInvoiceService.execute(
                sale=closed_sale,
                issued_by=non_staff_user,
            )

    def test_atomic_transaction(self, closed_sale, staff_with_perms):
        """Test service runs in atomic transaction."""
        from unittest.mock import patch

        initial_count = SaleInvoice.objects.count()

        # Mock to raise error after invoice creation
        with patch(
            "apps.sale.services.invoice.create_invoice_service.timezone.now",
            side_effect=Exception("Test error"),
        ):
            with pytest.raises(Exception):
                CreateInvoiceService.execute(
                    sale=closed_sale,
                    issued_by=staff_with_perms,
                )

        # Verify no invoice was created (transaction rolled back)
        assert SaleInvoice.objects.count() == initial_count

    def test_zero_tax_allowed(self, closed_sale, staff_with_perms):
        """Test invoice can be created with zero tax."""
        invoice = CreateInvoiceService.execute(
            sale=closed_sale,
            issued_by=staff_with_perms,
            tax_amount=Decimal("0.0000"),
        )

        assert invoice.tax_amount == Decimal("0.0000")
        assert invoice.total_amount == invoice.subtotal_amount

    def test_handles_zero_discount(self, closed_sale, staff_with_perms):
        """Test invoice handles sale with no discounts."""
        invoice = CreateInvoiceService.execute(
            sale=closed_sale,
            issued_by=staff_with_perms,
        )

        assert invoice.discount_amount == Decimal("0.0000")

    def test_invoice_number_year_based(self, closed_sale, staff_with_perms):
        """Test invoice number includes current year."""
        from django.utils import timezone

        invoice = CreateInvoiceService.execute(
            sale=closed_sale,
            issued_by=staff_with_perms,
        )

        current_year = timezone.now().year
        assert f"INV-{current_year}" in invoice.invoice_number
