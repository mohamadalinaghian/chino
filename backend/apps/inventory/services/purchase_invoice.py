from __future__ import annotations

from decimal import Decimal

from django.db import transaction

from ..models import PurchaseInvoice, PurchaseItem


class PurchaseInvoiceService:
    """Calculate the total cost of a purchase invoice – type-safe."""

    @staticmethod
    @transaction.atomic
    def get_total_cost(invoice: PurchaseInvoice) -> Decimal:
        """
        Sum ``PurchaseItem.total_cost`` for all items belonging to the invoice.

        Args:
            invoice: The ``PurchaseInvoice`` instance.

        Returns:
            Total cost as ``Decimal``.
        """
        total = Decimal("0")
        for item in PurchaseItem.objects.filter(purchase_invoice=invoice):
            total += item.total_cost
        return total
