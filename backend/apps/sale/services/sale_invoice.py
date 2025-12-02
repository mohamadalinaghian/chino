from __future__ import annotations

from decimal import Decimal
from typing import TypedDict

from apps.inventory.models import Product
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F, Sum
from django.utils.translation import gettext_lazy as _

from ..models import SaleInvoice, SaleItem
from .sale_item import SaleItemService

UserModel = get_user_model()


class SaleInvoiceService:
    """
    Orchestrates the entire order life cycle:
    - Create orders
    - Modify orders (before payment)
    - Calculate totals
    - Update cached fields
    - Handle status transitions
    """

    class OrderItemData(TypedDict):
        """Type definition for order items"""

        product: Product
        quantity: Decimal
        unit_price: Decimal
        discount_amount: Decimal
        sale_method: SaleItem.SaleType

    # ========== ORDER CREATION ========== #

    @staticmethod
    @transaction.atomic
    def create_order(
        staff: UserModel,
        items: list[OrderItemData],
        customer: UserModel | None = None,
        table_number: str | None = None,
        note: str = "",
    ) -> SaleInvoice:
        """
        Create new order with items and consume stock atomically.

        Args:
            staff: User placing the order (must be staff)
            items: List of order items with product, quantity, price, etc.
            customer: Optional customer reference
            table_number: Optional table/location identifier
            note: Optional order notes

        Returns:
            Created SaleInvoice with items attached

        Raises:
            ValidationError: If validation fails
        """
        # 1. Validate staff
        if not staff.is_staff:
            raise ValidationError(_("Only staff can create orders"))

        # 2. Create invoice
        invoice = SaleInvoice.objects.create(
            staff=staff,
            customer=customer,
            note=note,
            bill_status=SaleInvoice.BillStatus.OPEN,
        )

        # 3. Create items and consume stock
        total_amount = Decimal("0")
        total_cogs = Decimal("0")

        for item_data in items:
            product = item_data["product"]
            quantity = item_data["quantity"]
            unit_price = item_data["unit_price"]
            discount = item_data.get("discount_amount", Decimal("0"))
            sale_method = item_data["sale_method"]

            # Validate product is sellable
            SaleItemService.validate_saleable(product)

            # Consume stock and get material cost
            material_cost = SaleItemService.consume_and_calculate_cost(
                product=product,
                quantity=quantity,
                sale_method=sale_method,
            )

            # Create sale item
            SaleItem.objects.create(
                sale_invoice=invoice,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                discount_amount=discount,
                sale_method=sale_method,
                material_cost=material_cost,
            )

            # Update totals
            item_total = (unit_price * quantity) - discount
            total_amount += item_total
            total_cogs += material_cost

        # 4. Update cached totals
        invoice.cached_total_amount = total_amount
        invoice.save(update_fields=["cached_total_amount"])

        return invoice

    # ========== ORDER MODIFICATION ========== #

    @staticmethod
    @transaction.atomic
    def add_item_to_order(
        invoice: SaleInvoice,
        product: Product,
        quantity: Decimal,
        unit_price: Decimal,
        sale_method: SaleItem.SaleType,
        discount_amount: Decimal = Decimal("0"),
    ) -> SaleItem:
        """
        Add new item to existing order (only if not paid).

        Raises:
            ValidationError: If invoice is already paid or closed
        """
        # Validate invoice is modifiable
        if invoice.bill_status not in [SaleInvoice.BillStatus.OPEN]:
            raise ValidationError(_("Cannot modify paid or closed invoice"))

        # Validate product is sellable
        SaleItemService.validate_saleable(product)

        # Consume stock
        material_cost = SaleItemService.consume_and_calculate_cost(
            product=product,
            quantity=quantity,
            sale_method=sale_method,
        )

        # Create item
        item = SaleItem.objects.create(
            sale_invoice=invoice,
            product=product,
            quantity=quantity,
            unit_price=unit_price,
            discount_amount=discount_amount,
            sale_method=sale_method,
            material_cost=material_cost,
        )

        # Update cached total
        SaleInvoiceService.recalculate_totals(invoice)

        return item

    @staticmethod
    @transaction.atomic
    def remove_item_from_order(
        invoice: SaleInvoice,
        item: SaleItem,
        restore_stock: bool = True,
    ) -> None:
        """
        Remove item from order and optionally restore stock.

        Args:
            invoice: The invoice containing the item
            item: The item to remove
            restore_stock: Whether to add stock back (usually True)

        Raises:
            ValidationError: If invoice is paid or item doesn't belong to invoice
        """
        if item.sale_invoice_id != invoice.id:
            raise ValidationError(_("Item does not belong to this invoice"))

        if invoice.bill_status not in [SaleInvoice.BillStatus.OPEN]:
            raise ValidationError(_("Cannot modify paid invoice"))

        # Restore stock if requested
        if restore_stock:
            from apps.inventory.services import StockService

            StockService.add_to_stock(
                product=item.product,
                unit_price=item.material_cost / item.quantity,
                quantity=item.quantity,
            )

        # Delete item
        item.delete()

        # Recalculate totals
        SaleInvoiceService.recalculate_totals(invoice)

    @staticmethod
    @transaction.atomic
    def update_item_quantity(
        invoice: SaleInvoice,
        item: SaleItem,
        new_quantity: Decimal,
    ) -> SaleItem:
        """
        Change quantity of an existing item.
        Adjusts stock accordingly.

        Raises:
            ValidationError: If invoice is paid
        """
        if invoice.bill_status not in [SaleInvoice.BillStatus.OPEN]:
            raise ValidationError(_("Cannot modify paid invoice"))

        if new_quantity <= 0:
            raise ValidationError(_("Quantity must be positive"))

        old_quantity = item.quantity
        quantity_diff = new_quantity - old_quantity

        if quantity_diff > 0:
            # Need more stock
            additional_cost = SaleItemService.consume_and_calculate_cost(
                product=item.product,
                quantity=quantity_diff,
                sale_method=item.sale_method,
            )
            item.material_cost += additional_cost

        elif quantity_diff < 0:
            # Return stock
            from apps.inventory.services import StockService

            returned_qty = abs(quantity_diff)
            avg_cost = item.material_cost / old_quantity
            StockService.add_to_stock(
                product=item.product,
                unit_price=avg_cost,
                quantity=returned_qty,
            )
            # Adjust material cost proportionally
            item.material_cost = (item.material_cost / old_quantity) * new_quantity

        item.quantity = new_quantity
        item.save(update_fields=["quantity", "material_cost"])

        # Recalculate totals
        SaleInvoiceService.recalculate_totals(invoice)

        return item

    # ========== CALCULATIONS ========== #

    @staticmethod
    def recalculate_totals(invoice: SaleInvoice) -> None:
        """
        Recalculate and update cached totals for an invoice.
        Called after any item modification.
        """
        # Calculate total amount from items
        total = invoice.items.aggregate(
            total=Sum(F("unit_price") * F("quantity") - F("discount_amount"))
        )["total"] or Decimal("0")

        # Calculate total paid from verified transactions
        paid = invoice.transactions.filter(is_verified=True).aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0")

        # Update invoice
        invoice.cached_total_amount = total
        invoice.total_paid = paid
        invoice.save(update_fields=["cached_total_amount", "total_paid"])

    @staticmethod
    def get_balance_due(invoice: SaleInvoice) -> Decimal:
        """Return remaining amount to be paid"""
        return invoice.cached_total_amount - invoice.total_paid

    @staticmethod
    def get_total_cogs(invoice: SaleInvoice) -> Decimal:
        """Calculate total cost of goods sold for the invoice"""
        return invoice.items.aggregate(total=Sum("material_cost"))["total"] or Decimal(
            "0"
        )

    @staticmethod
    def get_gross_profit(invoice: SaleInvoice) -> Decimal:
        """Calculate gross profit (revenue - COGS)"""
        revenue = invoice.cached_total_amount
        cogs = SaleInvoiceService.get_total_cogs(invoice)
        return revenue - cogs

    # ========== STATUS MANAGEMENT ========== #

    VALID_STATUS_TRANSITIONS = {
        SaleInvoice.BillStatus.OPEN: [
            SaleInvoice.BillStatus.PARTIALLY_PAID,
            SaleInvoice.BillStatus.PAID,
            SaleInvoice.BillStatus.REFUNDED,
        ],
        SaleInvoice.BillStatus.PARTIALLY_PAID: [
            SaleInvoice.BillStatus.PAID,
            SaleInvoice.BillStatus.REFUNDED,
        ],
        SaleInvoice.BillStatus.PAID: [
            SaleInvoice.BillStatus.REFUNDED,
        ],
        SaleInvoice.BillStatus.REFUNDED: [],
    }

    @staticmethod
    @transaction.atomic
    def update_status_after_payment(invoice: SaleInvoice) -> None:
        """
        Automatically update invoice status based on payment totals.
        Called by PaymentService after each transaction.
        """
        balance = SaleInvoiceService.get_balance_due(invoice)

        if balance <= Decimal("0.01"):  # Paid (with tolerance)
            new_status = SaleInvoice.BillStatus.PAID
        elif invoice.total_paid > 0:  # Partially paid
            new_status = SaleInvoice.BillStatus.PARTIALLY_PAID
        else:  # Not paid yet
            new_status = SaleInvoice.BillStatus.OPEN

        if new_status != invoice.bill_status:
            SaleInvoiceService._transition_status(invoice, new_status)

    @staticmethod
    def _transition_status(invoice: SaleInvoice, new_status: str) -> None:
        """
        Internal method to transition status with validation.

        Raises:
            ValidationError: If transition is not allowed
        """
        valid_transitions = SaleInvoiceService.VALID_STATUS_TRANSITIONS.get(
            invoice.bill_status, []
        )

        if new_status not in valid_transitions:
            raise ValidationError(
                _(
                    f"Cannot transition from {
                  invoice.bill_status} to {new_status}"
                )
            )

        invoice.bill_status = new_status
        invoice.save(update_fields=["bill_status"])

    # ========== CANCELLATION ========== #

    @staticmethod
    @transaction.atomic
    def cancel_order(invoice: SaleInvoice, reason: str = "") -> None:
        """
        Cancel an open order and restore all stock.

        Args:
            invoice: The invoice to cancel
            reason: Reason for cancellation (stored in note)

        Raises:
            ValidationError: If invoice has payments
        """
        if invoice.total_paid > 0:
            raise ValidationError(
                _("Cannot cancel invoice with payments. Use refund instead.")
            )

        if invoice.bill_status != SaleInvoice.BillStatus.OPEN:
            raise ValidationError(_("Can only cancel open orders"))

        # Restore stock for all items
        from apps.inventory.services import StockService

        for item in invoice.items.all():
            if item.stock_consumed:
                avg_cost = item.material_cost / item.quantity
                StockService.add_to_stock(
                    product=item.product,
                    unit_price=avg_cost,
                    quantity=item.quantity,
                )

        # Delete invoice (CASCADE will delete items)
        invoice.note += f"\n[CANCELLED: {reason}]"
        invoice.save(update_fields=["note"])
        invoice.delete()

    # ========== QUERY HELPERS ========== #

    @staticmethod
    def get_open_orders(staff: UserModel | None = None):
        """Get all open/unpaid orders, optionally filtered by staff"""
        qs = (
            SaleInvoice.objects.filter(
                bill_status__in=[
                    SaleInvoice.BillStatus.OPEN,
                    SaleInvoice.BillStatus.PARTIALLY_PAID,
                ]
            )
            .select_related("staff", "customer")
            .prefetch_related("items__product")
        )

        if staff:
            qs = qs.filter(staff=staff)

        return qs.order_by("-issue_date")

    @staticmethod
    def get_daily_sales(date) -> Decimal:
        """Get total sales revenue for a specific date"""
        from django.utils import timezone

        start = timezone.datetime.combine(date, timezone.datetime.min.time())
        end = timezone.datetime.combine(date, timezone.datetime.max.time())

        total = SaleInvoice.objects.filter(
            issue_date__range=(start, end),
            bill_status=SaleInvoice.BillStatus.PAID,
        ).aggregate(total=Sum("cached_total_amount"))["total"]

        return total or Decimal("0")
