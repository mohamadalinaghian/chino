from decimal import Decimal
from django.db import transaction
from .weight_calculator import calculate_total_output_weight


@transaction.atomic
def normalize_components(recipe):
    """
    Normalize recipe components so that quantities are stored
    for producing exactly ONE atomic unit of the final product.

    Example:
        Recipe for 2000g sauce:
            1000g tomato, 100g garlic, 100g onion
        Stored as:
            tomato: 0.5
            garlic: 0.05
            onion: 0.05
        If product is countable:
            Quantities are per 1 unit of final product.
    """
    output_quantity = calculate_total_output_weight(recipe)

    for comp in recipe.components.all():
        comp.quantity = Decimal(comp.quantity) / output_quantity
        comp.save(update_fields=["quantity"])
