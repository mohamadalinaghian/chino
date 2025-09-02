from decimal import Decimal

import pytest
from apps.inventory.services.purchase_item import ZERO, PurchaseItemService
from apps.inventory.tests.factories.product import ProductFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestPurchaseItemService:
    # -------------------- get_unit_price --------------------
    def test_get_unit_price_valid(self):
        result = PurchaseItemService.get_unit_price(Decimal("5"), Decimal("50"))
        assert result == Decimal("10")

    def test_get_unit_price_zero_quantity_raises(self):
        with pytest.raises(ValidationError):
            PurchaseItemService.get_unit_price(Decimal("0"), Decimal("50"))

    # -------------------- valid_final_quantity --------------------
    def test_valid_final_quantity_with_simple_quantity(self):
        result = PurchaseItemService.valid_final_quantity(
            simple_quantity=Decimal("10"),
            package_quantity=None,
            package_count=None,
        )
        assert result == Decimal("10")

    def test_valid_final_quantity_with_package_input(self):
        result = PurchaseItemService.valid_final_quantity(
            simple_quantity=None,
            package_quantity=Decimal("2"),
            package_count=Decimal("5"),
        )
        assert result == Decimal("10")

    def test_valid_final_quantity_invalid_both_styles(self):
        with pytest.raises(ValidationError):
            PurchaseItemService.valid_final_quantity(
                simple_quantity=Decimal("5"),
                package_quantity=Decimal("2"),
                package_count=Decimal("3"),
            )

    def test_valid_final_quantity_missing_package_data(self):
        with pytest.raises(ValidationError):
            PurchaseItemService.valid_final_quantity(
                simple_quantity=None,
                package_quantity=Decimal("2"),
                package_count=None,
            )

    # -------------------- get_last_price_or_zero --------------------
    def test_get_last_price_or_zero_with_price(self):
        product = ProductFactory(last_purchased_price=Decimal("15"))
        assert PurchaseItemService.get_last_price_or_zero(product) == Decimal("15")

    def test_get_last_price_or_zero_none(self):
        product = ProductFactory(last_purchased_price=ZERO)
        assert PurchaseItemService.get_last_price_or_zero(product) == ZERO

    def test_get_last_price_or_zero_invalid_value(self):
        product = ProductFactory()
        product.last_purchased_price = "not-a-number"
        assert PurchaseItemService.get_last_price_or_zero(product) == ZERO

    # -------------------- within_change_ratio --------------------
    def test_within_change_ratio_first_purchase(self):
        product = ProductFactory(last_purchased_price=ZERO)
        result = PurchaseItemService.within_change_ratio(
            product, Decimal("100"), Decimal("0.2")
        )
        assert result is True

    def test_within_change_ratio_within_limit(self):
        product = ProductFactory(last_purchased_price=Decimal("100"))
        result = PurchaseItemService.within_change_ratio(
            product, Decimal("110"), Decimal("0.2")
        )
        assert result is True

    def test_within_change_ratio_outside_limit(self):
        product = ProductFactory(last_purchased_price=Decimal("100"))
        result = PurchaseItemService.within_change_ratio(
            product, Decimal("150"), Decimal("0.2")
        )
        assert result is False

    # -------------------- valid_unit_price --------------------
    def test_valid_unit_price_with_total_cost(self):
        result = PurchaseItemService.valid_unit_price(
            unit_price=None, total_cost=Decimal("200"), final_quantity=Decimal("10")
        )
        assert result == Decimal("20.00")

    def test_valid_unit_price_with_both_total_and_unit_raises(self):
        with pytest.raises(ValidationError):
            PurchaseItemService.valid_unit_price(
                unit_price=Decimal("10"),
                total_cost=Decimal("200"),
                final_quantity=Decimal("10"),
            )

    def test_valid_unit_price_with_only_unit_price(self):
        result = PurchaseItemService.valid_unit_price(
            unit_price=Decimal("12.345"), total_cost=None, final_quantity=Decimal("10")
        )
        assert result == Decimal("12.34")  # rounded to 2 decimals

    def test_valid_unit_price_without_any_price_raises(self):
        with pytest.raises(ValidationError):
            PurchaseItemService.valid_unit_price(
                unit_price=None, total_cost=None, final_quantity=Decimal("10")
            )
