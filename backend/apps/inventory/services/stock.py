from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from ..models import Product, Stock

ZERO = Decimal("0")
TOLERANCE = Decimal("0.001")


class StockService:
    """
    Managing FIFO.
    Add product after purchasing or production or Warehouse management.
    """

    @staticmethod
    def stock_traceable(product):
        if not product.is_stock_traceable:
            raise ValidationError(_("Product is not stock traceable"))

    @staticmethod
    def add_to_stock(product, unit_price, quantity):
        """
        Check product is stock traceable and then add to stock.
        """

        StockService.stock_traceable(product)

        obj = Stock.objects.create(
            stored_product=product,
            initial_quantity=quantity,
            remaining_quantity=quantity,
            unit_price=unit_price,
        )
        return obj

    @staticmethod
    def reserve_fifo(product, requested_qty: Decimal):
        """
        Consumes *exactly* ``requested_qty`` from FIFO stock.
        Returns the total cost of the consumed lots.
        """
        if requested_qty <= 0:
            raise ValidationError(_("Requested quantity must be greater than zero."))

        total_cost = ZERO
        remaining = requested_qty

        with transaction.atomic():
            # ``first_in`` must return a QuerySet ordered by entry date (FIFO)
            for entry in Stock.objects.first_in(product=product):
                if remaining <= 0:
                    break

                # -----------------------------------------------------------------
                # 1. Use the *exact* Decimal that came from the fraction map.
                #    No quantize / ROUND_FLOOR here – the caller already gave us
                #    a mathematically exact value (e.g. 1000.0 or 500.0).
                # -----------------------------------------------------------------
                if entry.remaining_quantity >= remaining:
                    # enough in this lot
                    total_cost += remaining * entry.unit_price
                    entry.remaining_quantity -= remaining
                    entry.save(update_fields=("remaining_quantity",))
                    remaining = ZERO
                else:
                    # take everything from this lot
                    total_cost += entry.remaining_quantity * entry.unit_price
                    remaining -= entry.remaining_quantity
                    entry.remaining_quantity = ZERO
                    entry.save(update_fields=("remaining_quantity",))

            # -----------------------------------------------------------------
            # 2. Final safety-net: ignore a shortage that is smaller than 1 mg.
            # -----------------------------------------------------------------
            if remaining > TOLERANCE:
                prod = Product.objects.get(id=product)
                raise ValidationError(
                    _(f"Not enough stock for {prod}: short by {remaining}")
                )
            # else: remaining ≤ 1 mg → treat as fully consumed
            return total_cost
