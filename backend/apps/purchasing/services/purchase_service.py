from decimal import Decimal
from django.db import transaction
from django.contrib.contenttypes.models import ContentType


def create_invoice_with_items(invoice_data: dict, items_data: list):
    """
    Create a PurchaseInvoice and its PurchaseItems and corresponding StockEntries atomically.

    Args:
        invoice_data: fields for PurchaseInvoice (e.g. supplier_id, discount_amount, note, created_by_id).
        items_data: list of dicts each with keys:
            - product_id (int)
            - quantity (Decimal/number)
            - unit_price (Decimal/number)  # final price provided by frontend include tax or extra_cost
            - expiry_date (date, optional)
            - note (str, optional)

    Returns:
        PurchaseInvoice instance.
    """
    from apps.purchasing.models import PurchaseInvoice, PurchaseItem
    from apps.inventory.models import Product, StockEntry

    with transaction.atomic():
        invoice = PurchaseInvoice.objects.create(**invoice_data)

        # Build PurchaseItem instances (not saved)
        item_objs = []
        product_ids = set()
        for item in items_data:
            product_ids.add(item["product_id"])
            item_objs.append(
                PurchaseItem(
                    purchase_invoice=invoice,
                    product_id=item["product_id"],
                    quantity=Decimal(str(item["quantity"])),
                    unit_price=Decimal(str(item["unit_price"])),
                    expiry_date=item.get("expiry_date"),
                    note=item.get("note", ""),
                )
            )

        # Bulk create items
        PurchaseItem.objects.bulk_create(item_objs)

        # Load products once to decide track_inventory
        products = Product.objects.filter(id__in=product_ids).only(
            "pk", "track_inventory"
        )
        product_map = {p.pk: p for p in products}

        # Build StockEntry objects only for tracked products
        ct = ContentType.objects.get_for_model(PurchaseItem)
        stock_objs = []
        # Refresh items to get pks (safer than relying on bulk_create behavior)
        created_items = PurchaseItem.objects.filter(
            purchase_invoice=invoice
        ).select_related("product")
        for item in created_items:
            product = product_map.get(item.product_id)
            if product and getattr(product, "track_inventory", False):
                stock_objs.append(
                    StockEntry(
                        product_id=item.product_id,
                        movement_type=StockEntry.MovementType.PURCHASE_IN,
                        quantity=item.quantity,
                        remaining_quantity=item.quantity,
                        unit_cost=item.unit_price,
                        content_type=ct,
                        object_id=item.pk,
                    )
                )

        if stock_objs:
            StockEntry.objects.bulk_create(stock_objs)

        # Compute invoice_final_cost once using DB aggregate for robustness
        from django.db.models import Sum, F, DecimalField

        agg = PurchaseItem.objects.filter(purchase_invoice=invoice).aggregate(
            total=Sum(F("quantity") * F("unit_price"), output_field=DecimalField())
        )
        items_total = agg["total"] or Decimal("0.00")
        invoice.invoice_final_cost = items_total - (
            invoice.discount_amount or Decimal("0.00")
        )
        invoice.save(update_fields=["invoice_final_cost"])

        return invoice
