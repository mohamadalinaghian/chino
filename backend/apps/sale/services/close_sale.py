from apps.sale.models import Sale
from django.db import transaction
from django.utils import timezone

from ..policies import can_close_sale


class CloseSaleService:
    @staticmethod
    @transaction.atomic
    def close_sale(*, sale: Sale, closed_by) -> Sale:
        # Permission
        can_close_sale(closed_by, sale)

        # Transition
        sale.state = Sale.State.CLOSED
        sale.closed_by = closed_by
        sale.closed_at = timezone.now()
        sale.save(update_fields=["state", "closed_by", "closed_at", "updated_at"])

        return sale
