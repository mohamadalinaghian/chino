from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from ..models import Stock


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
    def add_purchase_to_stock(product, unit_price, quantity):
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
