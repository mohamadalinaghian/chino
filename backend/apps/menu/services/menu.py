from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from ...core_setting.models import SiteSettings

Q0 = Decimal("1")  # quantize helper for integer rounding


class MenuItemService:
    """
    Compute a suggested sale price from purchase costs.

    Logic:
      1) If the product itself has stock layers (finished/processed): take the
         first-in (FIFO) unit_price from Stock (non-consuming "peek").
      2) Otherwise, explode the active recipe and sum component costs:
         for each component use its FIFO unit_price; if no stock exists,
         fallback to component.last_purchased_price. If neither exists, raise.

    Price formula:
        base_cost = unit_cost + overhead_value
        price_ex_tax = base_cost * (1 + profit_margin_fraction)
        final_price = price_ex_tax * (1 + tax_rate_fraction)

    Output:
        int (no decimals), rounded HALF_UP.
    """

    # ---------- Settings access ----------
    @staticmethod
    def _settings() -> SiteSettings:
        s = SiteSettings.get()
        if not s:
            # Should not happen because get() creates a default row, but keep a guard.
            raise ValidationError(_("Site settings not configured"))
        return s

    @classmethod
    def _profit_margin_frac(cls) -> Decimal:
        """
        SiteSettings.profit_margin is stored as percent [0..100).
        Convert to fraction [0..1).
        """
        pm_percent = cls._settings().profit_margin  # int/PositiveSmallInteger
        return Decimal(pm_percent) / Decimal("100")

    @classmethod
    def _tax_rate_frac(cls) -> Decimal:
        tr_percent = cls._settings().tax_rate
        return Decimal(tr_percent) / Decimal("100")

    @classmethod
    def _overhead_bar_value(cls) -> Decimal:
        """
        Overhead value is modeled as a fixed amount per serving (Decimal).
        """
        return Decimal(cls._settings().overhead_bar_value)

    @classmethod
    def _overhead_food_value(cls) -> Decimal:
        """
        Overhead value is modeled as a fixed amount per serving (Decimal).
        """
        return Decimal(cls._settings().overhead_food_value)

    # ---------- FIFO (peek) ----------
    @staticmethod
    def _fifo_first_unit_price(product) -> Decimal | None:
        """
        Return the unit_price of the oldest (FIFO) stock layer that still has remaining
        quantity for the given product. This does NOT consume stock. If no such layer
        exists, return None.
        """
        from ...inventory.models import Stock

        row = (
            Stock.objects.filter(stored_product=product, remaining_quantity__gt=0)
            .order_by("create_at")  # FIFO: oldest first
            .values_list("unit_price", flat=True)
            .first()
        )
        return Decimal(row) if row is not None else None

    # ---------- Recipe ----------
    @staticmethod
    def _active_recipe_components(product):
        """
        Return queryset of RecipeComponent for the product's active recipe.
        Product.active_recipe is a nullable FK to Recipe.
        """
        from ...inventory.models import Product as InvProduct
        from ...inventory.models import RecipeComponent

        prod = InvProduct.objects.only("id", "active_recipe").get(id=product.id)
        recipe = prod.active_recipe
        if recipe is None:
            raise ValidationError(_("Set active recipe first"))

        return (
            RecipeComponent.objects.filter(recipe=recipe)
            .select_related("consume_product")
            .only(
                "id",
                "quantity",
                "consume_product__id",
                "consume_product__last_purchased_price",
            )
        )

    # ---------- Price math & rounding ----------
    @classmethod
    def _apply_formula(cls, unit_cost: Decimal, item_type) -> Decimal:
        """
        final = (unit_cost + overhead_value) * (1 + profit_margin) * (1 + tax_rate)
        """
        from ..models import MenuCategory

        if item_type == MenuCategory.Group.BAR_ITEM:
            base = unit_cost + cls._overhead_bar_value()
        elif item_type == MenuCategory.Group.FOOD:
            base = unit_cost + cls._overhead_food_value()
        else:
            raise ValidationError(_("For this item no parent group submited"))

        price_ex_tax = base * (Decimal("1") + cls._profit_margin_frac())
        final = price_ex_tax * (Decimal("1") + cls._tax_rate_frac())
        return final

    @staticmethod
    def _round_int(amount: Decimal) -> int:
        """
        Round to an integer using HALF_UP. Returns Python int.
        """
        return int(amount.quantize(Q0, rounding=ROUND_HALF_UP))

    # ---------- Public API ----------
    @classmethod
    def suggested_price(cls, product):
        """
        Main entry:
          - Try FIFO unit price of the product itself (finished/processed stock).
          - If not available, compute from active recipe components using FIFO or
            last_purchased_price fallback.
          - Apply pricing formula and return an integer price.
        """
        # 1) Try product's own FIFO layer (peek)
        unit_cost = cls._fifo_first_unit_price(product)

        # 2) If missing, sum component costs from active recipe
        if unit_cost is None:
            unit_cost = Decimal("0")
            components = cls._active_recipe_components(product)

            for rc in components:
                comp = rc.consume_product  # FK object
                comp_price = cls._fifo_first_unit_price(comp)

                if comp_price is None:
                    # Fallback to last known purchase price (Decimal)
                    comp_price = Decimal(comp.last_purchased_price or 0)
                    if comp_price <= 0:
                        raise ValidationError(
                            _("There is no price record for this product")
                        )

                # Quantity in RecipeComponent is Decimal and must match the unit of comp_price
                unit_cost += Decimal(rc.quantity) * comp_price

        # 3) Apply formula and deterministic rounding to integer
        from ..models import Menu

        item_type = (
            Menu.objects.select_related("category")
            .get(id=product.id)
            .category.parent_group
        )
        raw_price = cls._apply_formula(unit_cost, item_type)
        return cls._round_int(raw_price), cls._round_int(unit_cost)
