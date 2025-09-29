from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from . import RecipeService, StockService


class ItemProductionService:
    """
    Every Item production will proceed from this channel to
        obey FIFO and save everything in its right place.
    """

    @staticmethod
    def get_production_total_cost(recipe, used_qt):
        """
        Calculate all the cost of production.
        """
        if used_qt <= 0:
            raise ValidationError(_("Requested quantity must be greater than zero."))
        # Retrive recipe components
        rc_comps = RecipeService.get_all_ingredients(recipe)

        total_cost = Decimal("0")
        required_qt = Decimal("0")

        # Pass through all componnets and Calculate total.
        with transaction.atomic():
            for comp in rc_comps:

                # How much of this component will used.
                required_qt = comp[1] * used_qt

                total_cost += StockService.reserve_fifo(
                    comp[0],
                    required_qt,
                )

            return total_cost
