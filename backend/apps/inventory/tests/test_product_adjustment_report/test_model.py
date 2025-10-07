import pytest
from apps.inventory.tests.factories import ProductAdjustmentReportFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestProductAdjustmentReportModel:

    def test_factory_creates_report(self):
        report = ProductAdjustmentReportFactory()
        assert report.pk is not None

    def test_str_returns_product_and_jalali_date(self):
        report = ProductAdjustmentReportFactory()
        expected = f"{report.product}: #{report.jalali_report_date}"
        assert str(report) == expected

    def test_clean_raises_if_no_change(self):
        report = ProductAdjustmentReportFactory.build(
            previous_quantity=10, current_quantity=10
        )
        with pytest.raises(ValidationError):
            report.full_clean()

    def test_cost_can_be_null(self):
        report = ProductAdjustmentReportFactory(cost=None)
        assert report.cost is None

    def test_report_date_auto_set(self):
        report = ProductAdjustmentReportFactory()
        assert report.report_date is not None
