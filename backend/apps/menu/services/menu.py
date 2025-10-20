from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from ...core_setting.models import SiteSettings

Q0 = Decimal("1")


class MenuItemService:
    # ---------- Settings ----------
    @staticmethod
    def _settings() -> SiteSettings:
        s = SiteSettings.get()
        if not s:
            raise ValidationError(_("Site settings not configured"))
        return s

    @classmethod
    def _profit_margin_frac(cls) -> Decimal:
        return Decimal(cls._settings().profit_margin) / Decimal("100")

    @classmethod
    def _tax_rate_frac(cls) -> Decimal:
        return Decimal(cls._settings().tax_rate) / Decimal("100")

    @classmethod
    def _overhead_bar_value(cls) -> Decimal:
        return Decimal(cls._settings().overhead_bar_value)

    @classmethod
    def _overhead_food_value(cls) -> Decimal:
        return Decimal(cls._settings().overhead_food_value)

    # ---------- FIFO (peek) ----------
    @staticmethod
    def _fifo_first_unit_price(product) -> Decimal | None:
        from ...inventory.models import Stock

        row = (
            Stock.objects.filter(stored_product=product, remaining_quantity__gt=0)
            .order_by("create_at", "id")
            .values_list("unit_price", flat=True)
            .first()
        )
        return Decimal(row) if row is not None else None

    # ---------- Recipe ----------
    @staticmethod
    def _active_recipe_components(product):
        from ...inventory.models import RecipeComponent

        recipe = getattr(product, "active_recipe", None)
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

    # ---------- Formula ----------
    @classmethod
    def _apply_formula(cls, unit_cost: Decimal, parent_group) -> Decimal:
        from ..models import MenuCategory

        if parent_group == MenuCategory.Group.BAR_ITEM:
            base = unit_cost + cls._overhead_bar_value()
        elif parent_group == MenuCategory.Group.FOOD:
            base = unit_cost + cls._overhead_food_value()
        else:
            raise ValidationError(_("For this item no parent group submited"))
        price_ex_tax = base * (Decimal("1") + cls._profit_margin_frac())
        final = price_ex_tax * (Decimal("1") + cls._tax_rate_frac())
        return final

    @staticmethod
    def _round_int(amount: Decimal) -> int:
        return int(amount.quantize(Q0, rounding=ROUND_HALF_UP))

    # ---------- Public API ----------
    @classmethod
    def suggested_price(cls, menu):
        """
        Input: instance of Menu
        Output: (final_price_int, unit_cost_int)
        """
        product = menu.name  # Product
        parent_group = menu.category.parent_group

        unit_cost = cls._fifo_first_unit_price(product)

        if unit_cost is None:
            unit_cost = Decimal("0")
            for rc in cls._active_recipe_components(product):
                comp = rc.consume_product
                comp_price = cls._fifo_first_unit_price(comp)
                if comp_price is None:
                    comp_price = Decimal(comp.last_purchased_price or 0)
                    if comp_price <= 0:
                        raise ValidationError(
                            _("There is no price record for this product")
                        )
                unit_cost += Decimal(rc.quantity) * comp_price

        raw_price = cls._apply_formula(unit_cost, parent_group)
        return cls._round_int(raw_price), cls._round_int(unit_cost)
