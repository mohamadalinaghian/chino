from decimal import Decimal


def calculate_total_output_weight(recipe):
    """
    Calculate the total output weight for a recipe.
    If the product is countable, the output is in 'units', not weight.
    """
    if recipe.product.is_countable:
        # For countable products, output is simply the base number of units.
        return Decimal(recipe.base_output_quantity or 1)

    total_weight = Decimal("0.00")
    for comp in recipe.components.select_related("component"):
        product = comp.component
        qty = comp.quantity

        if product.is_countable:
            total_weight += qty * product.unit_weight
        else:
            total_weight += qty

    return total_weight
