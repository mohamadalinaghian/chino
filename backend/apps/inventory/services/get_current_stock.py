from decimal import Decimal
from apps.inventory.models.stock_entry import StockEntry
from django.db.models import Sum


def get_current_stock(product):
    return StockEntry.objects.filter(product=product, is_remaining=True).aggregate(
        total_remaining=Sum("quantity_remaining")
    )["total_remaining"] or Decimal("0.0")
