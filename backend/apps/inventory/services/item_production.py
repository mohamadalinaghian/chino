from __future__ import annotations

from decimal import Decimal
from typing import Set, Tuple

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from ..models import Product, Recipe
from .recipe import RecipeService
from .stock import StockService


class ItemProductionService:
    """
    Production cost calculation with **recursive phantom (non-stock-traceable) resolution**.

    - If a component is stock-traceable → reserve FIFO.
    - If not → find its **active recipe** and recurse.
    - Supports arbitrary depth.
    - Fully atomic, type-safe, and cycle-safe.
    """

    @staticmethod
    @transaction.atomic
    def get_production_total_cost(recipe: Recipe, used_qt: Decimal) -> Decimal:
        """
        Calculate total production cost for ``used_qt`` of the finished product.

        Recursively resolves phantom components via their active recipes.

        Args:
            recipe: The ``Recipe`` for the finished product.
            used_qt: Quantity to produce (must be > 0).

        Returns:
            Total FIFO cost as ``Decimal``.

        Raises:
            ValidationError: If quantity <= 0 or no active recipe for phantom.
        """
        if used_qt <= 0:
            raise ValidationError(_("Requested quantity must be greater than zero."))

        total_cost = Decimal("0")
        seen_recipes: Set[int] = set()

        # Start recursion
        total_cost += ItemProductionService._resolve_and_reserve(
            recipe=recipe,
            multiplier=used_qt,
            seen_recipes=seen_recipes,
        )

        return total_cost

    # --------------------------------------------------------------------- #
    # Private recursive resolver
    # --------------------------------------------------------------------- #
    @staticmethod
    def _resolve_and_reserve(
        recipe: Recipe,
        multiplier: Decimal,
        seen_recipes: Set[int],
    ) -> Decimal:
        """
        Recursively resolve one recipe level and return its total cost.

        Args:
            recipe: Current recipe to resolve.
            multiplier: How much of this recipe's output is needed (e.g. 2.5).
            seen_recipes: Set of recipe IDs already visited (prevents cycles).

        Returns:
            Total cost for this level (sum of all leaf reservations).
        """
        if recipe.pk in seen_recipes:
            raise ValidationError(_("Recipe cycle detected."))

        seen_recipes.add(recipe.pk)

        total_cost = Decimal("0")

        # Get components: List[(Product, ratio_per_unit_output)]
        com_rao = ItemProductionService._get_components_and_ratio(recipe)
        for product, ratio in com_rao:
            required_qty = ratio * multiplier

            if product.is_stock_traceable:
                # Leaf: reserve from stock
                total_cost += StockService.reserve_fifo(product, required_qty)
            else:
                # Phantom: resolve its active recipe
                active_recipe = product.active_recipe
                if active_recipe is None:
                    raise ValidationError(
                        _(f"No active recipe for phantom product: {product}")
                    )

                # Recurse
                total_cost += ItemProductionService._resolve_and_reserve(
                    recipe=active_recipe,
                    multiplier=required_qty,
                    seen_recipes=seen_recipes,
                )

        # Remove from seen after backtracking
        seen_recipes.remove(recipe.pk)
        return total_cost

    # --------------------------------------------------------------------- #
    # Helper: convert raw quantity → exact Decimal ratio
    # --------------------------------------------------------------------- #
    @staticmethod
    def _get_exact_ratio(raw_quantity: Decimal) -> Decimal:
        """
        Convert component quantity to exact ratio per 1 unit of output.

        Uses FRACTION_MAP for common fractions; otherwise returns raw value.
        """
        raw = raw_quantity.quantize(Decimal("0.001"))
        num, den = RecipeService.FRACTION_MAP.get(raw, (None, None))
        if num and den:
            return Decimal(num) / Decimal(den)
        return Decimal(raw)

    @staticmethod
    def _get_components_and_ratio(recipe: Recipe) -> list[Tuple[Product, Decimal]]:
        """
        Get components: List[(Product, ratio_per_unit_output)]
        """
        return [
            (comp.consume_product, ratio)
            for comp in recipe.components.all()
            for ratio in [ItemProductionService._get_exact_ratio(comp.quantity)]
        ]
