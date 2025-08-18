# apps/inventory/services/stock_fifo_service.py
from django.db import transaction
from decimal import Decimal
from ..exceptions import InsufficientStockError
from django.utils.translation import gettext_lazy as _

ZERO = Decimal("0.00")


class StockFIFOService:
    """
    FIFO stock service.
    Handles stock consumption and cost calculation in FIFO order.
    """

    @staticmethod
    @transaction.atomic
    def consume_component(product, amount):
        """
        Consume `amount` of `product` from stock in FIFO order.
        Locks stock rows to prevent race conditions.
        Returns total cost of the consumed stock.
        """
        from ..models import StockEntry

        total_cost = ZERO
        remaining_amount = Decimal(amount)

        # Lock and get available stock in FIFO order
        stock_entries = StockEntry.objects.first_in(product=product)  # type: ignore

        for entry in stock_entries:
            if remaining_amount <= 0:
                break

            if entry.remaining_quantity >= remaining_amount:
                # Enough stock in this entry
                total_cost += remaining_amount * entry.unit_cost
                entry.remaining_quantity -= remaining_amount
                entry.save(update_fields=("remaining_quantity",))
                remaining_amount = ZERO
            else:
                # Use all of this entry and continue
                total_cost += entry.remaining_quantity * entry.unit_cost
                remaining_amount -= entry.remaining_quantity
                entry.remaining_quantity = ZERO
                entry.save(update_fields=("remaining_quantity",))

        if remaining_amount > 0:
            raise InsufficientStockError(
                _(
                    "Not enough stock for product %(product) (short by %(remaining_amount))"
                )
                % {"product": product, "remaining_amount": remaining_amount}
            )

        return total_cost
