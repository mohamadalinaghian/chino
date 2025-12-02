"""
Tests for RefundService.

Covers:
- Full invoice refunds
- Partial item refunds
- Partial quantity refunds
- Stock restoration
- Status updates
- Validation rules

IMPORTANT: Create paid invoices with stock before testing refunds.
"""

from decimal import Decimal

import pytest
from apps.inventory.models import Product, Stock
from apps.inventory.services import StockService
from apps.inventory.tests.factories import ProductFactory
from apps.sale.models import SaleInvoice
from apps.sale.services.payment import PaymentService
from apps.sale.services.refund import RefundService
from apps.sale.services.sale_invoice import SaleInvoiceService
from apps.user.tests.factories import AccountFactory, BankAccountFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestRefundService:
    """Test suite for RefundService."""

    def setup_method(self):
        """Set up test data with products in stock and paid invoice."""
        self.staff = AccountFactory(is_staff=True)
        self.bank_account = BankAccountFactory()

        # Create sellable products with stock
        self.product1 = ProductFactory(
            type=Product.ProductType.SELLABLE,
            is_active=True,
            is_stock_traceable=True,
        )
        self.product2 = ProductFactory(
            type=Product.ProductType.SELLABLE,
            is_active=True,
            is_stock_traceable=True,
        )

        # Add stock
        StockService.add_to_stock(
            product=self.product1,
            unit_price=Decimal("5000"),
            quantity=Decimal("100.000"),
        )
        StockService.add_to_stock(
            product=self.product2,
            unit_price=Decimal("3000"),
            quantity=Decimal("100.000"),
        )

        # Create and pay for invoice
        items = [
            {
                "product": self.product1,
                "quantity": Decimal("5.000"),
                "unit_price": Decimal("10000.0000"),
                "discount_amount": Decimal("0"),
                "sale_method": "STOCK",
            },
            {
                "product": self.product2,
                "quantity": Decimal("3.000"),
                "unit_price": Decimal("8000.0000"),
                "discount_amount": Decimal("0"),
                "sale_method": "STOCK",
            },
        ]

        self.invoice = SaleInvoiceService.create_order(
            staff=self.staff,
            items=items,
        )

        # Make full payment
        PaymentService.create_pos_payment(
            invoice=self.invoice,
            amount=self.invoice.cached_total_amount,
            target_account=self.bank_account,
            verified_by=self.staff,
        )

        self.invoice.refresh_from_db()

    def test_full_refund_restores_stock(self):
        """Test that full refund restores all stock."""
        stock1_before = Stock.objects.get_total(self.product1)
        stock2_before = Stock.objects.get_total(self.product2)

        RefundService.full_refund(
            invoice=self.invoice,
            refunded_by=self.staff,
            reason="Customer changed mind",
            restore_stock=True,
        )

        stock1_after = Stock.objects.get_total(self.product1)
        stock2_after = Stock.objects.get_total(self.product2)

        assert stock1_after == stock1_before + Decimal("5.000")
        assert stock2_after == stock2_before + Decimal("3.000")

    def test_full_refund_updates_invoice_status(self):
        """Test that full refund changes invoice status to REFUNDED."""
        RefundService.full_refund(
            invoice=self.invoice,
            refunded_by=self.staff,
            reason="Customer request",
        )

        self.invoice.refresh_from_db()
        assert self.invoice.bill_status == SaleInvoice.BillStatus.REFUNDED

    def test_full_refund_adds_note(self):
        """Test that refund reason is added to invoice notes."""
        reason = "Product defective"

        RefundService.full_refund(
            invoice=self.invoice,
            refunded_by=self.staff,
            reason=reason,
        )

        self.invoice.refresh_from_db()
        assert reason in self.invoice.note
        assert self.staff.name in self.invoice.note

    def test_full_refund_without_stock_restoration(self):
        """Test full refund without restoring stock."""
        stock_before = Stock.objects.get_total(self.product1)

        RefundService.full_refund(
            invoice=self.invoice,
            refunded_by=self.staff,
            restore_stock=False,
        )

        stock_after = Stock.objects.get_total(self.product1)
        assert stock_after == stock_before

    def test_cannot_refund_unpaid_invoice(self):
        """Test that only paid invoices can be refunded."""
        items = [
            {
                "product": self.product1,
                "quantity": Decimal("2.000"),
                "unit_price": Decimal("10000.0000"),
                "discount_amount": Decimal("0"),
                "sale_method": "STOCK",
            }
        ]

        unpaid_invoice = SaleInvoiceService.create_order(
            staff=self.staff,
            items=items,
        )

        with pytest.raises(ValidationError) as cm:
            RefundService.full_refund(
                invoice=unpaid_invoice,
                refunded_by=self.staff,
            )

        assert "paid" in str(cm.value).lower()

    def test_partial_refund_single_item_full_quantity(self):
        """Test partial refund of one complete item."""
        item = self.invoice.items.filter(product=self.product1).first()
        stock_before = Stock.objects.get_total(self.product1)
        initial_item_count = self.invoice.items.count()

        refund_amount = RefundService.partial_refund(
            invoice=self.invoice,
            items_to_refund=[(item, item.quantity)],
            refunded_by=self.staff,
            reason="Wrong item ordered",
        )

        expected_refund = item.unit_price * item.quantity
        assert refund_amount == expected_refund
        assert self.invoice.items.count() == initial_item_count - 1

        stock_after = Stock.objects.get_total(self.product1)
        assert stock_after == stock_before + Decimal("5.000")

        self.invoice.refresh_from_db()
        assert self.invoice.cached_total_amount < Decimal("74000.0000")

    def test_partial_refund_partial_quantity(self):
        """Test partial refund of only some quantity of an item."""
        item = self.invoice.items.filter(product=self.product1).first()
        original_quantity = item.quantity
        refund_qty = Decimal("2.000")

        stock_before = Stock.objects.get_total(self.product1)

        RefundService.partial_refund(
            invoice=self.invoice,
            items_to_refund=[(item, refund_qty)],
            refunded_by=self.staff,
            reason="Customer wants less",
        )

        item.refresh_from_db()
        assert item.quantity == original_quantity - refund_qty

        stock_after = Stock.objects.get_total(self.product1)
        assert stock_after == stock_before + refund_qty

    def test_partial_refund_multiple_items(self):
        """Test partial refund of multiple items."""
        item1 = self.invoice.items.filter(product=self.product1).first()
        item2 = self.invoice.items.filter(product=self.product2).first()

        stock1_before = Stock.objects.get_total(self.product1)
        stock2_before = Stock.objects.get_total(self.product2)

        RefundService.partial_refund(
            invoice=self.invoice,
            items_to_refund=[(item1, item1.quantity), (item2, item2.quantity)],
            refunded_by=self.staff,
            reason="Full order cancellation",
        )

        assert self.invoice.items.count() == 0

        self.invoice.refresh_from_db()
        assert self.invoice.bill_status == SaleInvoice.BillStatus.REFUNDED

        assert Stock.objects.get_total(self.product1) == stock1_before + Decimal(
            "5.000"
        )
        assert Stock.objects.get_total(self.product2) == stock2_before + Decimal(
            "3.000"
        )

    def test_cannot_refund_more_than_sold(self):
        """Test that refund quantity cannot exceed sold quantity."""
        item = self.invoice.items.first()

        with pytest.raises(ValidationError) as cm:
            RefundService.partial_refund(
                invoice=self.invoice,
                items_to_refund=[(item, item.quantity + Decimal("1.000"))],
                refunded_by=self.staff,
            )

        assert "more than" in str(cm.value).lower()

    def test_refund_with_zero_quantity_fails(self):
        """Test that refund with zero quantity raises error."""
        item = self.invoice.items.first()

        with pytest.raises(ValidationError) as cm:
            RefundService.partial_refund(
                invoice=self.invoice,
                items_to_refund=[(item, Decimal("0"))],
                refunded_by=self.staff,
            )

        assert "positive" in str(cm.value).lower()

    def test_partial_refund_without_stock_restoration(self):
        """Test partial refund without restoring stock."""
        item = self.invoice.items.first()
        stock_before = Stock.objects.get_total(self.product1)

        RefundService.partial_refund(
            invoice=self.invoice,
            items_to_refund=[(item, Decimal("2.000"))],
            refunded_by=self.staff,
            restore_stock=False,
        )

        stock_after = Stock.objects.get_total(self.product1)
        assert stock_after == stock_before

    def test_partial_refund_recalculates_invoice_totals(self):
        """Test that partial refund correctly recalculates invoice totals."""
        original_total = self.invoice.cached_total_amount
        item = self.invoice.items.filter(product=self.product1).first()

        refund_qty = Decimal("2.000")
        RefundService.partial_refund(
            invoice=self.invoice,
            items_to_refund=[(item, refund_qty)],
            refunded_by=self.staff,
        )

        self.invoice.refresh_from_db()
        expected_reduction = item.unit_price * refund_qty
        expected_new_total = original_total - expected_reduction

        assert self.invoice.cached_total_amount == expected_new_total

    # def test_partial_refund_maintains_material_cost_proportion(self):
    #     """Test that partial refund adjusts material cost proportionally."""
    #     item = self.invoice.items.first()
    #     original_mc = item.material_cost
    #     original_qty = item.quantity
    #
    #     refund_qty = Decimal("2.000")
    #     remaining_qty = original_qty - refund_qty
    #
    #     RefundService.partial_refund(
    #         invoice=self.invoice,
    #         items_to_refund=[(item, refund_qty)],
    #         refunded_by=self.staff,
    #     )
    #
    #     item.refresh_from_db()
    #     expected_material_cost = (original_mc / original_qty) * remaining_qty
    #
    #     assert round(float(item.material_cost), 2) == round(
    #         float(expected_material_cost), 2
    #     )

    def test_partial_refund_adds_note_to_invoice(self):
        """Test that partial refund adds note to invoice."""
        item = self.invoice.items.first()
        reason = "Customer complaint"

        RefundService.partial_refund(
            invoice=self.invoice,
            items_to_refund=[(item, Decimal("1.000"))],
            refunded_by=self.staff,
            reason=reason,
        )

        self.invoice.refresh_from_db()
        assert "PARTIAL REFUND" in self.invoice.note
        assert reason in self.invoice.note

    def test_partial_refund_returns_refund_amount(self):
        """Test that partial refund returns correct refund amount."""
        item = self.invoice.items.first()
        refund_qty = Decimal("2.000")

        refund_amount = RefundService.partial_refund(
            invoice=self.invoice,
            items_to_refund=[(item, refund_qty)],
            refunded_by=self.staff,
        )

        item_total = (item.unit_price * item.quantity) - item.discount_amount
        expected_refund = (item_total / item.quantity) * refund_qty

        assert refund_amount == expected_refund
