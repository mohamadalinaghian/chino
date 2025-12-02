from __future__ import annotations

from decimal import Decimal

from apps.inventory.models import Product
from apps.inventory.services import ItemProductionService, StockService
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _


class SaleItemService:
    """
    Business rules for sale items:
    - Stock consumption
    - COGS calculation
    - Validation
    """

    # ========== VALIDATION ========== #

    @staticmethod
    def validate_saleable(product: Product) -> None:
        """
        Ensure product can be sold.

        Raises:
            ValidationError: If product is not sellable or inactive
        """
        if not product.is_active:
            raise ValidationError(_(f"Product '{product.name}' is not active"))

        if product.type != Product.ProductType.SELLABLE:
            raise ValidationError(
                _(
                    f"Product '{
                  product.name}' is not sellable (type: {product.type})"
                )
            )

    # ========== STOCK CONSUMPTION & COGS ========== #

    @staticmethod
    @transaction.atomic
    def consume_and_calculate_cost(
        product: Product,
        quantity: Decimal,
        sale_method: str,
    ) -> Decimal:
        """
        Consume stock and return the material cost (COGS).

        Args:
            product: Product being sold
            quantity: Quantity to consume
            sale_method: "STOCK" or "PHANTOM"

        Returns:
            Material cost (COGS) as Decimal

        Raises:
            ValidationError: If insufficient stock or invalid method
        """
        if quantity <= 0:
            raise ValidationError(_("Quantity must be positive"))

        if sale_method == "STOCK":
            # Direct FIFO consumption
            cost = StockService.reserve_fifo(product, quantity)
            return cost

        elif sale_method == "PHANTOM":
            # Made-to-order: recursively resolve recipe
            recipe = product.active_recipe
            if not recipe:
                raise ValidationError(_(f"No active recipe for '{product.name}'"))

            # Use ItemProductionService for recursive cost calculation
            cost = ItemProductionService.get_production_total_cost(
                recipe=recipe,
                used_qt=quantity,
            )
            return cost

        else:
            raise ValidationError(_(f"Invalid sale method: {sale_method}"))

    @staticmethod
    def calculate_item_profit(
        unit_price: Decimal,
        quantity: Decimal,
        discount: Decimal,
        material_cost: Decimal,
    ) -> Decimal:
        """Calculate profit for a single item"""
        revenue = (unit_price * quantity) - discount
        profit = revenue - material_cost
        return profit

    @staticmethod
    def calculate_margin_percentage(
        unit_price: Decimal,
        quantity: Decimal,
        discount: Decimal,
        material_cost: Decimal,
    ) -> Decimal:
        """Calculate profit margin as percentage"""
        revenue = (unit_price * quantity) - discount
        if revenue == 0:
            return Decimal("0")

        profit = revenue - material_cost
        margin = (profit / revenue) * 100
        return margin.quantize(Decimal("0.01"))
