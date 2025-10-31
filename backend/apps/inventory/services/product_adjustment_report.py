from __future__ import annotations

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from ..models import Product, ProductAdjustmentReport, Stock
from .stock import StockService


class ProductAdjustmentService:
    """
    Stock quantity adjustments – type-safe.

    Receives a ``Product`` instance and the desired quantity.
    """

    @staticmethod
    def adjust_product(
        product: Product, session: str, current_quantity: Decimal
    ) -> None:
        """
        Bring the stock quantity of ``product`` to ``current_quantity``.

        * If ``current_quantity`` < stock → reduce via FIFO and record a cost.
        * If ``current_quantity`` > stock → add using the highest known price.

        Args:
            product: The ``Product`` to adjust.
            session: Identifier for the adjustment session (audit).
            current_quantity: Desired final quantity.
        """
        total_stock = Stock.objects.get_total(product)

        if current_quantity == total_stock:
            return

        if current_quantity < total_stock:
            reduction = total_stock - current_quantity
            cost = StockService.reserve_fifo(product, reduction)

            ProductAdjustmentReport.objects.create(
                session=session,
                product=product,
                previous_quantity=total_stock,
                current_quantity=current_quantity,
                cost=cost,
            )
        else:
            max_price = Stock.objects.max_price(product)
            if max_price == 0:
                max_price = product.last_purchased_price or Decimal("0")
                if max_price == 0:
                    raise ValidationError(
                        _("There is no price history for this product")
                    )

            increase = current_quantity - total_stock
            StockService.add_to_stock(product, max_price, increase)

            ProductAdjustmentReport.objects.create(
                product=product,
                session=session,
                previous_quantity=total_stock,
                current_quantity=current_quantity,
            )
