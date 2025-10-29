from decimal import Decimal

import pytest
from apps.core_setting.tests.factories import SiteSettingsFactory
from apps.inventory.tests.factories import (
    ProductFactory,
    RecipeComponentFactory,
    RecipeFactory,
    StockFactory,
)
from apps.menu.models import MenuCategory
from apps.menu.services import MenuItemService
from apps.menu.tests.factories import MenuCategoryFactory, MenuFactory
from django.core.exceptions import ValidationError
from django.test.utils import override_settings


@pytest.mark.django_db
class TestMenuItemService:
    def test_settings_happy_path(self):
        """Test _settings retrieves existing SiteSettings."""
        settings = SiteSettingsFactory()
        retrieved = MenuItemService._settings()
        assert retrieved == settings

    def test_settings_error_not_found(self):
        """Test _settings raises ValidationError if no SiteSettings."""
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                MenuItemService._settings()
            assert "Site settings not configured" in exc.value.messages

    def test_profit_margin_frac_happy_path(self):
        """Test _profit_margin_frac calculates correctly."""
        SiteSettingsFactory(profit_margin=50)
        assert MenuItemService._profit_margin_frac() == Decimal("0.5")

    def test_tax_rate_frac_happy_path(self):
        """Test _tax_rate_frac calculates correctly."""
        SiteSettingsFactory(tax_rate=10)
        assert MenuItemService._tax_rate_frac() == Decimal("0.1")

    def test_overhead_bar_value_happy_path(self):
        """Test _overhead_bar_value retrieves correctly."""
        SiteSettingsFactory(overhead_bar_value=5)
        assert MenuItemService._overhead_bar_value() == Decimal("5")

    def test_overhead_food_value_happy_path(self):
        """Test _overhead_food_value retrieves correctly."""
        SiteSettingsFactory(overhead_food_value=3)
        assert MenuItemService._overhead_food_value() == Decimal("3")

    def test_fifo_first_unit_price_happy_path(self):
        """Test _fifo_first_unit_price returns first stock price."""
        product = ProductFactory()
        StockFactory(
            stored_product=product,
            unit_price=10,
            remaining_quantity=1,
            create_at="2023-01-01",
        )
        StockFactory(
            stored_product=product,
            unit_price=15,
            remaining_quantity=1,
            create_at="2023-01-02",
        )
        assert MenuItemService._fifo_first_unit_price(product) == Decimal("10")

    def test_fifo_first_unit_price_no_stock(self):
        """Test _fifo_first_unit_price returns None if no stock."""
        product = ProductFactory()
        assert MenuItemService._fifo_first_unit_price(product) is None

    def test_fifo_first_unit_price_zero_remaining(self):
        """Test _fifo_first_unit_price skips zero remaining quantity."""
        product = ProductFactory()
        StockFactory(stored_product=product, unit_price=10, remaining_quantity=0)
        assert MenuItemService._fifo_first_unit_price(product) is None

    def test_active_recipe_components_happy_path(self):
        """Test _active_recipe_components returns components."""
        product = ProductFactory(type="SELLABLE")
        recipe = RecipeFactory(produced_product=product)
        product.active_recipe = recipe
        product.save()
        component = RecipeComponentFactory(
            recipe=recipe, consume_product=ProductFactory(), quantity=2
        )
        components = MenuItemService._active_recipe_components(product)
        assert components.count() == 1
        assert components.first() == component

    def test_active_recipe_components_error_no_recipe(self):
        """Test _active_recipe_components raises if no active recipe."""
        product = ProductFactory(active_recipe=None)
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                MenuItemService._active_recipe_components(product)
            assert "Set active recipe first" in exc.value.messages

    def test_active_recipe_components_inactive_recipe(self):
        """Test _active_recipe_components raises if no active recipe set."""
        product = ProductFactory(active_recipe=None, type="SELLABLE")
        RecipeFactory(produced_product=product)  # Recipe exists but not set as active
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                MenuItemService._active_recipe_components(product)
            assert "Set active recipe first" in exc.value.messages

    def test_apply_formula_bar_item_happy_path(self):
        """Test _apply_formula for BAR_ITEM."""
        SiteSettingsFactory(profit_margin=100, tax_rate=10, overhead_bar_value=5)
        result = MenuItemService._apply_formula(
            Decimal("10"), MenuCategory.Group.BAR_ITEM
        )
        assert result == Decimal("33")  # (10 + 5) * (1 + 1.0) * (1 + 0.1) = 33

    def test_apply_formula_food_happy_path(self):
        """Test _apply_formula for FOOD."""
        SiteSettingsFactory(profit_margin=50, tax_rate=20, overhead_food_value=3)
        result = MenuItemService._apply_formula(Decimal("20"), MenuCategory.Group.FOOD)
        assert result == Decimal("41.4")  # (20 + 3) * (1 + 0.5) * (1 + 0.2) = 41.4

    def test_apply_formula_error_invalid_group(self):
        """Test _apply_formula raises for invalid group."""
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                MenuItemService._apply_formula(Decimal("10"), "INVALID")
            assert "For this item no parent group submitted" in exc.value.messages

    def test_round_int_happy_path(self):
        """Test _round_int rounds correctly."""
        assert MenuItemService._round_int(Decimal("10.4")) == 10
        assert MenuItemService._round_int(Decimal("10.5")) == 11
        assert MenuItemService._round_int(Decimal("10")) == 10

    def test_calculate_unit_cost_fifo_priority(self):
        """Test _calculate_unit_cost uses FIFO first."""
        product = ProductFactory(last_purchased_price=15)
        StockFactory(stored_product=product, unit_price=10, remaining_quantity=1)
        assert MenuItemService._calculate_unit_cost(product) == Decimal("10")

    def test_calculate_unit_cost_recipe_fallback(self):
        """Test _calculate_unit_cost uses recipe components."""
        product = ProductFactory(type="SELLABLE")
        recipe = RecipeFactory(produced_product=product)
        product.active_recipe = recipe
        product.save()
        comp_product = ProductFactory(last_purchased_price=5)
        RecipeComponentFactory(recipe=recipe, consume_product=comp_product, quantity=2)
        assert MenuItemService._calculate_unit_cost(product) == Decimal(
            "10"
        )  # 5 * 2 = 10

    def test_calculate_unit_cost_recipe_with_fifo(self):
        """Test _calculate_unit_cost uses FIFO in recipe components."""
        product = ProductFactory(type="SELLABLE")
        recipe = RecipeFactory(produced_product=product)
        product.active_recipe = recipe
        product.save()
        comp_product = ProductFactory()
        StockFactory(stored_product=comp_product, unit_price=3, remaining_quantity=1)
        RecipeComponentFactory(recipe=recipe, consume_product=comp_product, quantity=4)
        assert MenuItemService._calculate_unit_cost(product) == Decimal(
            "12"
        )  # 3 * 4 = 12

    def test_calculate_unit_cost_last_purchased_fallback(self):
        """Test _calculate_unit_cost uses last_purchased_price."""
        product = ProductFactory(last_purchased_price=20, active_recipe=None)
        assert MenuItemService._calculate_unit_cost(product) == Decimal("20")

    def test_calculate_unit_cost_error_no_price(self):
        """Test _calculate_unit_cost raises if no price record."""
        product = ProductFactory(last_purchased_price=0, active_recipe=None)
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                MenuItemService._calculate_unit_cost(product)
            assert "No price record for this product" in exc.value.messages

    def test_calculate_unit_cost_recipe_error_no_comp_price(self):
        """Test _calculate_unit_cost raises if component has no price."""
        product = ProductFactory(type="SELLABLE")
        recipe = RecipeFactory(produced_product=product)
        product.active_recipe = recipe
        product.save()
        comp_product = ProductFactory(last_purchased_price=0)
        RecipeComponentFactory(recipe=recipe, consume_product=comp_product, quantity=1)
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                MenuItemService._calculate_unit_cost(product)
            assert "There is no price record for this product" in exc.value.messages

    def test_suggested_price_happy_path(self):
        """Test suggested_price calculates correctly."""
        SiteSettingsFactory(profit_margin=100, tax_rate=10, overhead_bar_value=5)
        category = MenuCategoryFactory(parent_group=MenuCategory.Group.BAR_ITEM)
        product = ProductFactory(last_purchased_price=10, type="SELLABLE")
        menu = MenuFactory(name=product, category=category)
        price, cost = MenuItemService.suggested_price(menu.id)
        assert cost == 10
        assert price == 33  # (10 + 5) * (1 + 1.0) * (1 + 0.1) = 33

    def test_suggested_price_error_menu_not_found(self):
        """Test suggested_price raises if menu not found."""
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                MenuItemService.suggested_price(999)
            assert "Menu item not found" in exc.value.messages

    def test_suggested_price_edge_zero_cost(self):
        """Test suggested_price with zero cost raises error."""
        SiteSettingsFactory()
        category = MenuCategoryFactory(parent_group=MenuCategory.Group.FOOD)
        product = ProductFactory(
            last_purchased_price=0, type="SELLABLE", active_recipe=None
        )
        menu = MenuFactory(name=product, category=category)
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                MenuItemService.suggested_price(menu.id)
            assert "No price record for this product" in exc.value.messages

    def test_extra_req_cost_happy_path(self):
        """Test extra_req_cost calculates correctly."""
        SiteSettingsFactory(profit_margin=50)
        product = ProductFactory(last_purchased_price=10)
        cost = MenuItemService.extra_req_cost(product.id, Decimal("2"))
        assert cost == 30  # 10 * (1 + 0.5) * 2 = 30

    def test_extra_req_cost_error_quantity_non_positive(self):
        """Test extra_req_cost raises for non-positive quantity."""
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                MenuItemService.extra_req_cost(1, Decimal("0"))
            assert "Quantity must be positive" in exc.value.messages

    def test_extra_req_cost_error_product_not_found(self):
        """Test extra_req_cost raises if product not found."""
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                MenuItemService.extra_req_cost(999, Decimal("1"))
            assert "Product not found" in exc.value.messages

    def test_extra_req_cost_edge_fractional_quantity(self):
        """Test extra_req_cost with fractional quantity."""
        SiteSettingsFactory(profit_margin=100)
        product = ProductFactory(last_purchased_price=5)
        cost = MenuItemService.extra_req_cost(product.id, Decimal("1.5"))
        assert cost == 15  # 5 * (1 + 1.0) * 1.5 = 15
