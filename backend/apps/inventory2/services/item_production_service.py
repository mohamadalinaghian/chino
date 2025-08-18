from decimal import Decimal
from django.db import transaction
from django.contrib.contenttypes.models import ContentType
from .stock_fifo_service import StockFIFOService


class ItemProductionService:
    """
    Handles production of items:
    - Consumes recipe components from stock (FIFO)
    - Calculates production cost
    - Creates stock entry for the produced item
    """

    @staticmethod
    @transaction.atomic
    def total_production_cost(recipe, input_quantity):
        """
        Calculate total cost of recipe components and reduce stock accordingly.
        """
        from ..models import RecipeComponent

        total_cost = Decimal("0.00")
        components = RecipeComponent.objects.filter(recipe=recipe)

        for component in components:
            amount_usage = component.quantity * Decimal(input_quantity)
            total_cost += StockFIFOService.consume_component(
                component.component, amount_usage
            )

        return total_cost

    @staticmethod
    def unit_production_cost(total_cost, output_quantity):
        """
        Calculate unit cost from total cost.
        """
        return (Decimal(total_cost) / Decimal(output_quantity)).quantize(
            Decimal("0.01")
        )

    @staticmethod
    @transaction.atomic
    def create_stock_for_production(item_production):
        """
        Main entry point: process production and create stock entry.
        """
        from ..models import StockEntry

        recipe = item_production.recipe
        input_quantity = item_production.input_quantity
        output_quantity = item_production.output_quantity

        # Calculate costs and consume components
        total_cost = ItemProductionService.total_production_cost(recipe, input_quantity)
        unit_cost = ItemProductionService.unit_production_cost(
            total_cost, output_quantity
        )

        # Create stock entry for the produced item
        StockEntry.objects.create(
            product=item_production.product,
            movement_type=StockEntry.MovementType.PRODUCTION_IN,
            initial_quantity=output_quantity,
            remaining_quantity=output_quantity,
            unit_cost=unit_cost,
            content_type=ContentType.objects.get_for_model(item_production),
            object_id=item_production.pk,
        )

        return unit_cost
