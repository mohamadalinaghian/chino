from decimal import Decimal

import pytest
from apps.inventory.forms.purchase_item import PurchaseItemInlineForm
from apps.inventory.tests.factories import ProductFactory, PurchaseInvoiceFactory


@pytest.mark.django_db
class TestPurchaseItemInlineForm:

    def test_valid_with_simple_quantity_and_unit_price(self):
        product = ProductFactory(last_purchased_price=Decimal("5.5"))
        PurchaseInvoiceFactory()
        form = PurchaseItemInlineForm(
            data={
                "purchased_product": product.id,
                "quantity": "10.00",
                "purchased_unit_price": "5.50",
            }
        )
        assert form.is_valid(), form.errors
        cleaned = form.cleaned_data
        assert cleaned["quantity"] == Decimal("10.00")
        assert cleaned["purchased_unit_price"] == Decimal("5.50")

    def test_valid_with_package_quantity_and_count(self):
        product = ProductFactory(last_purchased_price=Decimal("10"))
        PurchaseInvoiceFactory()
        form = PurchaseItemInlineForm(
            data={
                "purchased_product": product.id,
                "package_quantity": "2.50",
                "package_count": "4",
                "total_cost": "100",
            }
        )
        assert form.is_valid(), form.errors
        cleaned = form.cleaned_data
        assert cleaned["quantity"] == Decimal("10.00")
        assert cleaned["purchased_unit_price"] == Decimal("10.00")

    def test_error_if_both_quantity_and_package_fields_given(self):
        product = ProductFactory()
        form = PurchaseItemInlineForm(
            data={
                "purchased_product": product.id,
                "quantity": "5.00",
                "package_quantity": "2",
                "package_count": "3",
            }
        )
        assert not form.is_valid()
        assert "Can not assign both quantity styles" in str(form.errors)

    def test_error_if_package_count_without_quantity(self):
        product = ProductFactory()
        form = PurchaseItemInlineForm(
            data={
                "purchased_product": product.id,
                "package_count": "3",
            }
        )
        assert not form.is_valid()
        assert "Package quantity and package count must assigned together" in str(
            form.errors
        )

    def test_error_if_both_unit_price_and_total_cost_given(self):
        product = ProductFactory()
        form = PurchaseItemInlineForm(
            data={
                "purchased_product": product.id,
                "quantity": "5",
                "purchased_unit_price": "10",
                "total_cost": "100",
            }
        )
        assert not form.is_valid()
        assert "Enter total cost or unit price not both" in str(form.errors)

    def test_unit_price_is_computed_from_total_cost(self):
        product = ProductFactory(last_purchased_price=Decimal("20"))
        form = PurchaseItemInlineForm(
            data={
                "purchased_product": product.id,
                "quantity": "5",
                "total_cost": "100",
            }
        )
        assert form.is_valid(), form.errors
        cleaned = form.cleaned_data
        assert cleaned["purchased_unit_price"] == Decimal("20.00")

    def test_negative_values_are_invalid(self):
        product = ProductFactory()
        invalid_data = {
            "purchased_product": product.id,
            "quantity": "-5",
            "purchased_unit_price": "-10",
            "total_cost": "-100",
            "package_quantity": "-2",
            "package_count": "-3",
        }
        form = PurchaseItemInlineForm(data=invalid_data)
        assert not form.is_valid()
        errors = str(form.errors)
        assert "Only positive numbers" in errors

    def test_within_change_ratio_rejects_large_price_deviation(self, settings):
        product = ProductFactory(last_purchased_price=Decimal("10.00"))
        settings.PURCHASE_VALID_CHANGE_RATIO = Decimal("0.1")  # 10% allowed
        form = PurchaseItemInlineForm(
            data={
                "purchased_product": product.id,
                "quantity": "5",
                "purchased_unit_price": "20",  # 100% higher
            }
        )
        assert not form.is_valid()
        assert "Unit price deviates too much" in str(form.errors)
