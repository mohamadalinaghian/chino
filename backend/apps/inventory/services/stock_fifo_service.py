from django.db import transaction
from decimal import Decimal




class StockFIFOService:
    """
    FIFO system for stock.
    It will calculate price of components and products.
    It will update remaining quantity of components and products.
    """
    @staticmethod
    @transaction.atomic
    def consume_component( component, amount):
        """
        Get target product for reducing stock amount and
        calculating cost in FIFO system.
        """
        from ..models import StockEntry
        



