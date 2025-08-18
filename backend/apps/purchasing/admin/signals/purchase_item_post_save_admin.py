"""
Admin-only signal for updating stock and invoice costs after saving a PurchaseItem.

This signal listens to the creation and update of PurchaseItem instances,
and performs two main actions:

1. Creates or updates StockEntry corresponding to this purchase item.
2. Recalculates and updates the parent PurchaseInvoice's final cost.

This signal is intended to be imported and connected only in admin modules.
"""

from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.timezone import now
from django.contrib.contenttypes.models import ContentType
from django.db.models import Sum, F, DecimalField
from ...models import PurchaseItem, PurchaseInvoice
from ....inventory2.models import StockEntry


@receiver(post_save, sender=PurchaseItem)
def purchase_item_post_save_admin(sender, instance: PurchaseItem, created, **kwargs):
    """
    Handle PurchaseItem save event to update stock and invoice cost.

    Args:
        sender (Model): The model class (PurchaseItem).
        instance (PurchaseItem): The saved PurchaseItem instance.
        created (bool): Whether this instance was created or updated.
        **kwargs: Extra keyword arguments.
    """

    # Calculate cost of this item
    item_cost = instance.quantity * instance.unit_price

    # Find existing StockEntry for this PurchaseItem (if any)
    stock_entry_qs = StockEntry.objects.filter(
        content_type=ContentType.objects.get_for_model(PurchaseItem),
        object_id=instance.pk,
        movement_type=StockEntry.MovementType.PURCHASE_IN,
    )

    if stock_entry_qs.exists():
        # Update existing StockEntry
        stock_entry = stock_entry_qs.first()
        stock_entry.quantity = instance.quantity
        stock_entry.remaining_quantity = instance.quantity  # reset remaining quantity
        stock_entry.unit_cost = instance.unit_price
        stock_entry.is_depleted = False
        stock_entry.save(
            update_fields=["quantity", "remaining_quantity", "unit_cost", "is_depleted"]
        )
    else:
        # Create new StockEntry
        StockEntry.objects.create(
            product=instance.product,
            movement_type=StockEntry.MovementType.PURCHASE_IN,
            quantity=instance.quantity,
            remaining_quantity=instance.quantity,
            unit_cost=instance.unit_price,
            content_type=ContentType.objects.get_for_model(PurchaseItem),
            object_id=instance.pk,
            is_depleted=False,
            created_at=now(),
        )

    # Recalculate the PurchaseInvoice's final cost
    purchase_invoice = instance.purchase_invoice
    total_cost = purchase_invoice.items.aggregate(
        total=Sum(
            F("quantity") * F("unit_price"),
            output_field=DecimalField(),
        )
    )["total"] or Decimal("0")

    # Subtract invoice discount if any
    purchase_invoice.invoice_final_cost = total_cost - purchase_invoice.discount_amount
    purchase_invoice.save(update_fields=["invoice_final_cost"])
