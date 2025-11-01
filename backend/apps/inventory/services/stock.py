from __future__ import annotations

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from ..models import Product, Stock

ZERO = Decimal("0")
TOLERANCE = Decimal("0.001")


class StockService:
    """
    FIFO stock management – fully type-safe.

    All operations receive a ``Product`` instance and return ``Stock`` objects
    or ``Decimal`` costs.
    """

    # --------------------------------------------------------------------- #
    # Private helpers
    # --------------------------------------------------------------------- #
    @staticmethod
    def _ensure_traceable(product: Product) -> None:
        """Raise ``ValidationError`` if the product is not stock-traceable."""
        if not product.is_stock_traceable:
            raise ValidationError(
                _("Product is not stock traceable") + ": " + product.name
            )

    # --------------------------------------------------------------------- #
    # Public API
    # --------------------------------------------------------------------- #
    @staticmethod
    def add_to_stock(product: Product, unit_price: Decimal, quantity: Decimal) -> Stock:
        """
        Create a new stock entry for *exactly* ``quantity`` of ``product``.

        Args:
            product: The ``Product`` instance to store.
            unit_price: Price per unit (Decimal).
            quantity: Quantity to add (must be > 0).

        Returns:
            The created ``Stock`` object.
        """
        StockService._ensure_traceable(product)

        return Stock.objects.create(
            stored_product=product,
            initial_quantity=quantity,
            remaining_quantity=quantity,
            unit_price=unit_price,
        )

    @staticmethod
    @transaction.atomic
    def reserve_fifo(product: Product, requested_qty: Decimal) -> Decimal:
        """
        Consume *exactly* ``requested_qty`` from the oldest stock lots (FIFO).

        Args:
            product: The ``Product`` instance to consume.
            requested_qty: Quantity to reserve (must be > 0).

        Returns:
            Total cost of the consumed lots.

        Raises:
            ValidationError: If there is not enough stock (shortage > 1 mg).
        """
        if requested_qty <= 0:
            raise ValidationError(_("Requested quantity must be greater than zero."))

        total_cost: Decimal = ZERO
        remaining: Decimal = requested_qty

        for entry in Stock.objects.first_in(product=product):
            if remaining <= 0:
                break

            if entry.remaining_quantity >= remaining:
                total_cost += remaining * entry.unit_price
                entry.remaining_quantity -= remaining
                entry.save(update_fields=("remaining_quantity",))
                remaining = ZERO
            else:
                total_cost += entry.remaining_quantity * entry.unit_price
                remaining -= entry.remaining_quantity
                entry.remaining_quantity = ZERO
                entry.save(update_fields=("remaining_quantity",))

            if entry.remaining_quantity <= TOLERANCE:
                entry.delete()

        if remaining > TOLERANCE:
            raise ValidationError(
                _(f"Not enough stock for {product}: short by {remaining}")
            )
        return total_cost
