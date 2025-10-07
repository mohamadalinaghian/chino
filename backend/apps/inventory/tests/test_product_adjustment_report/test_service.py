from decimal import Decimal

import pytest
from apps.inventory.models import ProductAdjustmentReport, Stock
from apps.inventory.services import ProductAdjustmentService
from apps.inventory.tests.factories import ProductFactory
from apps.user.tests.factories import AccountFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestProductAdjustmentService:

    def test_no_change_does_nothing(self):
        product = ProductFactory()
        # فرض اینکه Stock total == 10
        Stock.objects.create(
            stored_product=product,
            initial_quantity=10,
            remaining_quantity=10,
            unit_price=5,
        )
        initial_count = ProductAdjustmentReport.objects.count()
        ProductAdjustmentService.adjust_product(
            product, staff=AccountFactory(), current_quantity=10
        )
        assert ProductAdjustmentReport.objects.count() == initial_count

    def test_reducing_stock_creates_report_and_reduces_stock(self):
        product = ProductFactory()
        Stock.objects.create(
            stored_product=product,
            initial_quantity=20,
            remaining_quantity=20,
            unit_price=5,
        )
        staff = AccountFactory()
        ProductAdjustmentService.adjust_product(product, staff, current_quantity=10)
        report = ProductAdjustmentReport.objects.last()
        assert report.previous_quantity == 20
        assert report.current_quantity == 10
        assert report.cost is not None

    def test_increasing_stock_creates_report_and_adds_stock(self):
        product = ProductFactory()
        Stock.objects.create(
            stored_product=product,
            initial_quantity=10,
            remaining_quantity=10,
            unit_price=5,
        )
        staff = AccountFactory()
        ProductAdjustmentService.adjust_product(product, staff, current_quantity=20)
        report = ProductAdjustmentReport.objects.last()
        assert report.previous_quantity == 10
        assert report.current_quantity == 20
        assert report.cost is None  # برای افزایش موجودی cost nullable است

    def test_error_if_no_price_history_for_increase(self):
        product = ProductFactory(last_purchased_price=Decimal("0"))
        # هیچ Stock وجود ندارد
        staff = AccountFactory()
        with pytest.raises(ValidationError):
            ProductAdjustmentService.adjust_product(product, staff, current_quantity=10)
