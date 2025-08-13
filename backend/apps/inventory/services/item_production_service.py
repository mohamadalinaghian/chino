from decimal import Decimal
from django.db import transaction
from django.apps import apps


@transaction.atomic
def process_production(production):
    """
    Handles stock movements and cost calculation for a production record.
    - Deducts recipe components from stock (FIFO)
    - Adds produced item to stock
    - Calculates unit cost and total cost
    """
    if not production.recipe:
        raise ValueError("Production must have a recipe to calculate costs.")

    RecipeComponent = apps.get_model("inventory", "RecipeComponent")
    StockEntry = apps.get_model("inventory", "StockEntry")
    total_cost = Decimal("0.00")

    for comp in RecipeComponent.objects.filter(recipe=production.recipe):
        required_qty = comp.quantity * (
            production.input_quantity / production.recipe.product.is_countable
            and 1
            or 1
        )
        cost_for_comp = _consume_stock_fifo(comp.component, required_qty, production)
        total_cost += cost_for_comp

    unit_cost = total_cost / production.output_quantity
    StockEntry.objects.create(
        product=production.product,
        movement_type=StockEntry.MovementType.PRODUCTION_IN,
        quantity=production.output_quantity,
        remaining_quantity=production.output_quantity,
        unit_cost=unit_cost,
        source_object=production,
    )

    production.unit_cost = unit_cost
    production.total_cost = total_cost
    production.save(update_fields=["unit_cost", "total_cost"])


def _consume_stock_fifo(product, quantity_needed, production):
    """
    Deducts stock entries for a product using FIFO and returns total cost.
    """
    from decimal import Decimal

    total_cost = Decimal("0.0000")
    remaining_qty = quantity_needed

    fifo_entries = (
        StockEntry.objects.filter(
            product=product,
            remaining_quantity__gt=0,
            movement_type__in=[
                StockEntry.MovementType.PURCHASE_IN,
                StockEntry.MovementType.PRODUCTION_IN,
            ],
        )
        .order_by("created_at")
        .select_for_update()
    )

    for entry in fifo_entries:
        if remaining_qty <= 0:
            break
        take_qty = min(entry.remaining_quantity, remaining_qty)
        entry.remaining_quantity -= take_qty
        entry.is_depleted = entry.remaining_quantity <= 0
        entry.save(update_fields=["remaining_quantity", "is_depleted"])
        total_cost += take_qty * entry.unit_cost
        remaining_qty -= take_qty

    StockEntry.objects.create(
        product=product,
        movement_type=StockEntry.MovementType.PRODUCTION_OUT,
        quantity=-quantity_needed,
        remaining_quantity=0,
        unit_cost=None,
        source_object=production,
    )

    if remaining_qty > 0:
        raise ValueError(f"Insufficient stock for {product.name}")

    return total_cost
