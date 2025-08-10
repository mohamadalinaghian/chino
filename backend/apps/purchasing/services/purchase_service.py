"""
Service layer for purchase-related business logic.
All operations that change multiple rows or require domain rules should be here.
"""

from decimal import Decimal
from django.db import transaction, models
from apps.purchasing.managers import PurchaseItemManager
from apps.inventory.managers import StockEntryManager
from apps.purchasing.models import PurchaseInvoice, PurchaseItem
from apps.inventory.models import StockEntry


def calculate_invoice_totals(invoice: PurchaseInvoice) -> Decimal:
    """
    Calculate invoice raw total from items.
    Use DB aggregation where possible.
    """
    return invoice.items.with_totals().aggregate(total=models.Sum("calculated_total"))[
        "total"
    ] or Decimal("0.00")


@transaction.atomic
def finalize_invoice(invoice: PurchaseInvoice, created_by=None):
    """
    Confirm the invoice. Responsibilities:
    - validate invoice state (e.g., DRAFT -> CONFIRMED)
    - create StockEntry rows for each purchase item (IN entries)
    - use invoice-level extra_cost/tax/discount allocation if needed
    - set invoice.status to CONFIRMED and save
    """
    if invoice.status != "DRAFT":
        raise ValueError("Only DRAFT invoices can be finalized")

    # create stock entries for each item
    for item in invoice.items.select_related("product").all():
        StockEntry.objects.create(
            product=item.product,
            movement_type=StockEntry.MovementType.PURCHASE_IN,
            quantity=item.quantity,
            remaining_quantity=item.quantity,
            unit_cost=item.unit_price,
            content_type=None,  # optionally set to invoice ContentType
            object_id=invoice.pk,
        )

    invoice.status = "CONFIRMED"
    invoice.save(update_fields=["status"])
    return invoice
