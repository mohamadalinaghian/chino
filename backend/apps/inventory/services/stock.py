# backend/apps/inventory/services/stock.py

from decimal import Decimal
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from apps.inventory.models import StockEntry
from apps.inventory.models.product import Product


class InsufficientStock(Exception):
    """Raised when stock is insufficient to fulfill a consumption request."""

    pass


def consume_and_cost(product: Product, quantity: Decimal) -> Decimal:
    """
    Consume `quantity` units of `product` from stock in FIFO order.
    Returns the total cost for the consumed amount.

    Steps:
    1. Fetch active StockEntry rows for this product, oldest first.
    2. Deduct from each entry up to its remaining quantity.
    3. Stop when `quantity` is fulfilled or raise InsufficientStock.
    4. Return sum(amount_consumed * entry.unit_cost).
    """

    total_cost = Decimal("0.0")
    remaining = quantity

    # All in a transaction to avoid race conditions
    with transaction.atomic():
        # Lock selected rows
        entries = (
            StockEntry.objects.select_for_update(nowait=True, of=("self",))
            .filter(product=product, is_remaining=True)[:10]
            .order_by("created_at", "pk")
        )

        for entry in entries:
            if remaining <= 0:
                break

            avail = entry.quantity_remaining
            use = avail if avail < remaining else remaining

            # use StockEntry.consume for bookkeeping
            cost = entry.consume(use)
            total_cost += cost
            remaining -= use

        if remaining > 0:
            # Not enough stock
            raise InsufficientStock(
                _(f"Not enough stock to consume {quantity}. Short by {remaining}.")
            )

    return total_cost
