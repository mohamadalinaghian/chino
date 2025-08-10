"""
Service layer to create production batches.
Responsibilities:
- validate recipe vs product
- calculate cost of inputs using FIFO consumption
- create production IN stock entry for output with computed unit_cost
- create production OUT stock entries for consumed inputs
- store computed unit_cost and total_cost on ItemProduction
"""

from decimal import Decimal, getcontext
from django.db import transaction
from django.contrib.contenttypes.models import ContentType
from apps.inventory.managers import StockEntryManager
from apps.inventory.models import ItemProduction, StockEntry, RecipeComponent
from django.core.exceptions import ValidationError

getcontext().prec = 12  # ensure enough precision


@transaction.atomic
def create_production(
    product, recipe, input_quantity, output_quantity, creators=None, notes=None
):
    """
    Create an ItemProduction and corresponding StockEntry movements.

    High level algorithm:
    1. For each recipe component compute required_qty scaled by output_quantity.
    2. Use StockEntryManager.consume_fifo to reserve inputs and compute cost.
    3. Create PRODUCTION_OUT StockEntry per consumed input (negative quantity).
    4. Compute total_cost = sum(consumed_qty * unit_cost) + allocated_extra
    5. Compute unit_cost = total_cost / output_quantity
    6. Create PRODUCTION_IN StockEntry for finished goods with unit_cost and remaining_quantity = output_quantity
    7. Persist ItemProduction with computed costs.
    """
    # validations
    if recipe and recipe.product != product:
        raise ValidationError("Recipe must belong to the produced product")

    output_quantity = Decimal(str(output_quantity))
    if output_quantity <= 0:
        raise ValidationError("output_quantity must be > 0")

    # 1. compute required inputs
    components = RecipeComponent.objects.filter(recipe=recipe).select_related(
        "component"
    )
    required_map = {}
    for comp in components:
        # scaling factor: assume recipe quantity corresponds to one unit of product.
        # if your recipe UX uses different base, adapt here.
        required_qty = comp.quantity * Decimal(
            str(output_quantity)
        )  # adjust if recipe base differs
        required_map[comp.component] = required_qty

    total_cost = Decimal("0.00")
    consumed_plan = []

    # 2. consume inputs using FIFO
    for component_product, req_qty in required_map.items():
        plan = StockEntry.objects.consume_fifo(component_product, req_qty)
        # plan is list of (entry, qty)
        for entry, qty in plan:
            # accumulate cost
            if entry.unit_cost is None:
                raise ValidationError("StockEntry missing unit_cost for FIFO valuation")
            total_cost += Decimal(entry.unit_cost) * Decimal(qty)
            consumed_plan.append((entry, qty))

    # 3. create OUT entries and update remaining_quantity
    for entry, qty in consumed_plan:
        # create negative movement record referencing source entry
        StockEntry.objects.create(
            product=entry.product,
            movement_type=StockEntry.MovementType.PRODUCTION_OUT,
            quantity=-Decimal(qty),
            remaining_quantity=0,  # outs are not "available"
            unit_cost=entry.unit_cost,
            content_type=ContentType.objects.get_for_model(ItemProduction),
            object_id=None,  # set after ItemProduction created
        )
        # update original entry remaining_quantity
        entry.remaining_quantity = Decimal(entry.remaining_quantity) - Decimal(qty)
        entry.is_depleted = entry.remaining_quantity <= 0
        entry.save(update_fields=["remaining_quantity", "is_depleted"])

    # 4 & 5 compute unit cost
    unit_cost = (total_cost / Decimal(output_quantity)).quantize(Decimal("0.0001"))
    total_cost = total_cost.quantize(Decimal("0.0001"))

    # 6 create IN entry for finished goods
    prod_in = StockEntry.objects.create(
        product=product,
        movement_type=StockEntry.MovementType.PRODUCTION_IN,
        quantity=Decimal(output_quantity),
        remaining_quantity=Decimal(output_quantity),
        unit_cost=unit_cost,
        content_type=ContentType.objects.get_for_model(ItemProduction),
        object_id=None,  # will set after ItemProduction created
    )

    # 7 create ItemProduction record
    item_prod = ItemProduction.objects.create(
        product=product,
        recipe=recipe,
        input_quantity=input_quantity,
        output_quantity=output_quantity,
        unit_cost=unit_cost,
        total_cost=total_cost,
        notes=notes or "",
    )
    if creators:
        item_prod.creators.set(creators)

    # link content_object ids for traceability
    prod_in.object_id = item_prod.pk
    prod_in.save(update_fields=["object_id"])
    # update the earlier production-out entries' object_id (optional)
    StockEntry.objects.filter(
        content_type=ContentType.objects.get_for_model(ItemProduction),
        object_id__isnull=True,
        movement_type=StockEntry.MovementType.PRODUCTION_OUT,
    ).update(object_id=item_prod.pk)

    return item_prod
