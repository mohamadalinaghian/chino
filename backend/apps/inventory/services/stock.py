from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from ..exceptions import InsufficientStockError
from ..models import Product, Stock

ZERO = Decimal("0")


class StockService:
    """
    Managing FIFO.
    Add product after purchasing.
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
    def reserve_fifo(product, requested_qty):
        """
        Reserves (consumes) requested_qty from stock lots in FIFO order.

        Returns cost of consumed product (with updated remaining quantities).
        Raises InsufficientStockError if total available < requested_qty.
        """
        if requested_qty <= 0:
            raise ValidationError(_("Requested quantity must be greater than zero."))

        total_cost = ZERO
        remaining_amount = Decimal(requested_qty)

        with transaction.atomic():
            # Lock and get available stock in FIFO order
            stock_entries = Stock.objects.first_in(product=product)  # type: ignore

            for entry in stock_entries:
                if remaining_amount <= 0:
                    break

                if entry.remaining_quantity >= remaining_amount:
                    # Enough stock in this entry
                    total_cost += remaining_amount * entry.unit_price
                    entry.remaining_quantity -= remaining_amount
                    entry.save(update_fields=("remaining_quantity",))
                    remaining_amount = ZERO
                else:
                    # Use all of this entry and continue
                    total_cost += entry.remaining_quantity * entry.unit_price
                    remaining_amount -= entry.remaining_quantity
                    entry.remaining_quantity = ZERO
                    entry.save(update_fields=("remaining_quantity",))

            if remaining_amount > 0:
                product = Product.objects.get(id=product)
                raise InsufficientStockError(
                    _(
                        f"Not enough stock for product: {product} short by: {remaining_amount} "
                    )
                )

            return total_cost
