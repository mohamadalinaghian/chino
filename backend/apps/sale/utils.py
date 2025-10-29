from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import SaleInvoice

User = get_user_model()


def get_or_create_open_invoice(staff: User) -> SaleInvoice:
    """
    One OPEN invoice per staff member at a time.
    Creates it if none exists.
    """
    invoice, _ = SaleInvoice.objects.get_or_create(
        staff=staff,
        bill_status=SaleInvoice.BillStatus.OPEN,
        defaults={"issue_date": timezone.now()},
    )
    return invoice
