from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from typing import Tuple  # For suggested_price return type

from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.utils.translation import gettext_lazy as _

from ...core_setting.models import SiteSettings
from ...inventory.models import Product, RecipeComponent, Stock
from ..models import MenuCategory

Q0 = Decimal("1")


class MenuItemService:
    # ---------- Settings ----------
    @staticmethod
    def _settings() -> SiteSettings:
        try:
            return SiteSettings.objects.get()
        except ObjectDoesNotExist:
            raise ValidationError(_("Site settings not configured"))

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
    def _fifo_first_unit_price(product: Product) -> Decimal | None:
        row = (
            Stock.objects.filter(stored_product=product, remaining_quantity__gt=0)
            .order_by("create_at", "id")
            .values_list("unit_price", flat=True)
            .first()
        )
        return Decimal(row) if row is not None else None

    # ---------- Recipe ----------
    @staticmethod
    def _active_recipe_components(product: Product):
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
    def _apply_formula(cls, unit_cost: Decimal, parent_group: str) -> Decimal:
        if parent_group == MenuCategory.Group.BAR_ITEM:
            base = unit_cost + cls._overhead_bar_value()
        elif parent_group == MenuCategory.Group.FOOD:
            base = unit_cost + cls._overhead_food_value()
        else:
            raise ValidationError(_("For this item no parent group submitted"))
        price_ex_tax = base * (Q0 + cls._profit_margin_frac())
        final = price_ex_tax * (Q0 + cls._tax_rate_frac())
        return final

    @staticmethod
    def _round_int(amount: Decimal) -> int:
        return int(amount.quantize(Q0, rounding=ROUND_HALF_UP))

    # ---------- Shared Logic ----------
    @classmethod
    def _calculate_unit_cost(cls, product: Product) -> Decimal:
        """
        Centralized method to compute unit cost with fallbacks:
        - FIFO stock price
        - Recipe components (if active_recipe exists)
        - last_purchased_price (for raw/processed without recipe/stock)
        """
        unit_cost = cls._fifo_first_unit_price(product)
        if unit_cost is not None:
            return unit_cost

        unit_cost = Decimal("0")
        if product.active_recipe:
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
        else:
            unit_cost = Decimal(product.last_purchased_price or 0)
            if unit_cost <= 0:
                raise ValidationError(_("No price record for this product"))

        return unit_cost

    # ---------- Public API ----------
    @classmethod
    def suggested_price(cls, menu_id: int) -> Tuple[int, int]:
        """
        Input: menu_id (int)
        Output: (final_price_int, unit_cost_int)
        """
        from ..models import Menu  # Avoid circular imports

        try:
            menu = Menu.objects.select_related("name", "category").get(id=menu_id)
        except ObjectDoesNotExist:
            raise ValidationError(_("Menu item not found"))

        product = menu.name  # Product instance
        parent_group = menu.category.parent_group

        unit_cost = cls._calculate_unit_cost(product)
        raw_price = cls._apply_formula(unit_cost, parent_group)
        return cls._round_int(raw_price), cls._round_int(unit_cost)

    @classmethod
    def extra_req_cost(cls, product_id: int, quantity: int) -> Tuple[int, Decimal]:
        """
        Calculate final price (not cost) of extra request in order.
        Skips tax and overhead intentionally.
        """
        if quantity <= 0:
            raise ValidationError(_("Quantity must be positive"))

        unit_price, unit_cost = cls.extra_req_price(product_id)
        return unit_price * quantity, unit_cost * quantity

    @classmethod
    def extra_req_price(cls, product_id) -> Tuple[int, Decimal]:
        try:
            product = Product.objects.get(id=product_id)
        except ObjectDoesNotExist:
            raise ValidationError(_("Product not found"))

        unit_cost = cls._calculate_unit_cost(product)
        unit_price = unit_cost * (Q0 + cls._profit_margin_frac())
        return cls._round_int(unit_price), unit_cost
