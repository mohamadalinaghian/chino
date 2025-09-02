from decimal import Decimal

from django.db import transaction

from ..models import PurchaseItem


class PurcahseInvoiceService:
    """
    Calculate total cost of invoice.
    """

    @staticmethod
    @transaction.atomic
    def get_total_cost(invoice):
        items = PurchaseItem.objects.filter(purchase_invoice=invoice).all()
        total_cost = Decimal("0")

        for item in items:
            total_cost += item.total_cost

        return total_cost
