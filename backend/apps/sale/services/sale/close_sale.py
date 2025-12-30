from apps.sale.models import Sale
from django.db import transaction
from django.utils import timezone

from ..policies import can_close_sale


class CloseSaleService:
    @staticmethod
    @transaction.atomic
    def close_sale(*, sale: Sale, performer) -> Sale:
        """
        Finalizes a sale, marks it as PAID/CLOSED, and ensures
        all financial totals are locked.
        """
        # 1. Policy Check
        can_close_sale(performer, sale)

        # 2. Logic: Mark as Closed
        sale.state = Sale.State.CLOSED
        sale.closed_by = performer
        sale.closed_at = timezone.now()

        # 3. Save
        sale.save(update_fields=["state", "closed_by", "closed_at", "updated_at"])

        # Note: This is where you would normally trigger:
        # - Receipt printing
        # - Inventory deduction (Ingredients reduction)
        # - Loyalty points calculation

        return sale
