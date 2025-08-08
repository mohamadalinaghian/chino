from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.purchasing.models import PurchaseItem
from apps.inventory.models import StockEntry


@receiver(post_save, sender=PurchaseItem)
def on_purchase_item_created(sender, instance, created, **kwargs):
    if created:
        StockEntry.objects.create(
            product=instance.item,
            source=instance,
            quantity_total=instance.quantity,
            quantity_remaining=instance.quantity,
            unit_cost=instance.get_unit_price(),
            is_remaining=True,
        )
