from __future__ import annotations

from decimal import Decimal

from apps.inventory.services import StockService
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from ..models import SaleInvoice, SaleItem
from .sale_invoice import SaleInvoiceService

UserModel = get_user_model()


class RefundService:
    """
    Handle refunds and returns:
    - Full invoice refunds
    - Partial item refunds
    - Stock restoration
    """

    @staticmethod
    @transaction.atomic
    def full_refund(
        invoice: SaleInvoice,
        refunded_by: UserModel,
        reason: str = "",
        restore_stock: bool = True,
    ) -> None:
        """
        Fully refund an invoice and restore all stock.

        Args:
            invoice: Invoice to refund
            refunded_by: User processing the refund
            reason: Reason for refund
            restore_stock: Whether to restore stock (usually True)

        Raises:
            ValidationError: If invoice is not paid
        """
        if invoice.bill_status != SaleInvoice.BillStatus.PAID:
            raise ValidationError(_("Can only refund paid invoices"))

        # Restore stock for all items
        if restore_stock:
            for item in invoice.items.all():
                if item.stock_consumed:
                    avg_cost = item.material_cost / item.quantity
                    StockService.add_to_stock(
                        product=item.product,
                        unit_price=avg_cost,
                        quantity=item.quantity,
                    )
                    item.stock_consumed = False
                    item.save(update_fields=["stock_consumed"])

        # Update invoice status
        invoice.bill_status = SaleInvoice.BillStatus.REFUNDED
        invoice.note += f"\n[REFUNDED by {refunded_by.name}: {reason}]"
        invoice.save(update_fields=["bill_status", "note"])

    @staticmethod
    @transaction.atomic
    def partial_refund(
        invoice: SaleInvoice,
        # [(item, qty_to_refund)]
        items_to_refund: list[tuple[SaleItem, Decimal]],
        refunded_by: UserModel,
        reason: str = "",
        restore_stock: bool = True,
    ) -> Decimal:
        """
        Refund specific items or partial quantities.

        Returns:
            Total refund amount

        Example:
            partial_refund(invoice, [
                (item1, Decimal('2')),  # Refund 2 units of item1
                (item2, Decimal('1')),  # Refund 1 unit of item2
            ])
        """
        if invoice.bill_status not in [
            SaleInvoice.BillStatus.PAID,
            SaleInvoice.BillStatus.PARTIALLY_PAID,
        ]:
            raise ValidationError(_("Can only refund paid/partially paid invoices"))

        total_refund_amount = Decimal("0")

        for item, qty_to_refund in items_to_refund:
            if qty_to_refund > item.quantity:
                raise ValidationError(
                    _(
                        f"Cannot refund more than sold quantity for {
                      item.product}"
                    )
                )

            if qty_to_refund <= 0:
                raise ValidationError(_("Refund quantity must be positive"))

            # Calculate refund amount proportionally
            item_total = (item.unit_price * item.quantity) - item.discount_amount
            refund_amount = (item_total / item.quantity) * qty_to_refund
            total_refund_amount += refund_amount

            # Restore stock proportionally
            if restore_stock and item.stock_consumed:
                avg_cost = item.material_cost / item.quantity
                StockService.add_to_stock(
                    product=item.product,
                    unit_price=avg_cost,
                    quantity=qty_to_refund,
                )

            # Update or delete item
            if qty_to_refund == item.quantity:
                # Full item refund - delete item
                item.delete()
            else:
                # Partial refund - reduce quantity
                new_quantity = item.quantity - qty_to_refund
                item.quantity = new_quantity
                item.material_cost = (item.material_cost / item.quantity) * new_quantity
                item.save(update_fields=["quantity", "material_cost"])

        # Recalculate invoice totals
        SaleInvoiceService.recalculate_totals(invoice)

        # Update status if needed
        if invoice.items.count() == 0:
            invoice.bill_status = SaleInvoice.BillStatus.REFUNDED
        else:
            SaleInvoiceService.update_status_after_payment(invoice)

        invoice.note += f"\n[PARTIAL REFUND by {refunded_by.name}: {reason}]"
        invoice.save(update_fields=["bill_status", "note"])

        return total_refund_amount
