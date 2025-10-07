from decimal import Decimal

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class ProductAdjustmentService:
    """
    With every adjustment, update the stock.
    """

    @staticmethod
    def adjust_product(product, staff, current_quantity):
        """
        User add product new quantity.
        Calculate diffrences and add it to Stock and ProductAdjustmentReport.
        """
        from ..models import Stock

        total_stock_qt = Stock.objects.get_total(product)

        if current_quantity == total_stock_qt:
            return

        from ..models import ProductAdjustmentReport
        from ..services import StockService

        if current_quantity < total_stock_qt:
            # First reduce quantity from Stock
            reduction_qt = Decimal(total_stock_qt - current_quantity)

            total_cost = StockService.reserve_fifo(product, reduction_qt)
            # Add Report
            ProductAdjustmentReport.objects.create(
                product=product,
                staff=staff,
                previous_quantity=total_stock_qt,
                current_quantity=current_quantity,
                cost=total_cost,
            )
        else:
            # Get max price
            max_price = Stock.objects.max_price(product)
            if max_price == 0:
                # no product in stock, get last purchase price
                from ..models import Product

                max_price = (
                    Product.objects.filter(id=product.id)
                    .values_list("last_purchased_price", flat=True)
                    .first()
                )
                if max_price == 0:
                    raise ValidationError(
                        _("There is no price history for this product")
                    )

            increase_qt = Decimal(current_quantity - total_stock_qt)
            StockService.add_to_stock(product, max_price, increase_qt)

            # Add Report
            ProductAdjustmentReport.objects.create(
                product=product,
                staff=staff,
                previous_quantity=total_stock_qt,
                current_quantity=current_quantity,
            )
