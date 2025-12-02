# apps/sale/tests/test_models/test_daily_financial_report_pytest.py
"""
Tests for DailyFinancialReport model.

Covers:
- Model creation and validation
- Revenue tracking fields
- Expense tracking fields
- Profit calculations
- Discrepancy tracking
- Report metadata
- Unique constraints
- Jalali date conversion
"""

from decimal import Decimal

import pytest
from apps.sale.models import DailyFinancialReport
from apps.sale.tests.factories import (
    DailyFinancialReportFactory,
    FinalizedDailyFinancialReportFactory,
    ReportWithDiscrepanciesFactory,
)
from apps.user.tests.factories import AccountFactory
from django.db import IntegrityError
from django.utils import timezone


@pytest.mark.django_db
class TestDailyFinancialReportModel:
    """Test suite for DailyFinancialReport model."""

    def test_create_daily_financial_report_with_all_fields(self):
        """Test creating a report with all fields."""
        staff = AccountFactory(is_staff=True)
        report = DailyFinancialReportFactory(
            report_date=timezone.now().date(),
            total_revenue=Decimal("1000000.0000"),
            pos_total=Decimal("400000.0000"),
            cash_total=Decimal("350000.0000"),
            card_transfer_total=Decimal("250000.0000"),
            purchase_expenses=Decimal("300000.0000"),
            operational_expenses=Decimal("100000.0000"),
            total_cogs=Decimal("350000.0000"),
            gross_profit=Decimal("650000.0000"),
            net_profit=Decimal("550000.0000"),
            generated_by=staff,
        )

        assert report.total_revenue == Decimal("1000000.0000")
        assert report.pos_total == Decimal("400000.0000")
        assert report.cash_total == Decimal("350000.0000")
        assert report.card_transfer_total == Decimal("250000.0000")
        assert report.purchase_expenses == Decimal("300000.0000")
        assert report.operational_expenses == Decimal("100000.0000")
        assert report.total_cogs == Decimal("350000.0000")
        assert report.gross_profit == Decimal("650000.0000")
        assert report.net_profit == Decimal("550000.0000")
        assert report.generated_by == staff

    def test_daily_financial_report_default_values(self):
        """Test that numeric fields default to 0."""
        staff = AccountFactory(is_staff=True)
        report = DailyFinancialReport.objects.create(
            report_date=timezone.now().date(),
            generated_by=staff,
        )

        assert report.total_revenue == Decimal("0")
        assert report.pos_total == Decimal("0")
        assert report.cash_total == Decimal("0")
        assert report.card_transfer_total == Decimal("0")
        assert report.purchase_expenses == Decimal("0")
        assert report.operational_expenses == Decimal("0")
        assert report.total_cogs == Decimal("0")
        assert report.gross_profit == Decimal("0")
        assert report.net_profit == Decimal("0")
        assert report.pos_discrepancy == Decimal("0")
        assert report.cash_discrepancy == Decimal("0")
        assert report.card_to_card_discrepancy == Decimal("0")

    def test_daily_financial_report_default_is_finalized_false(self):
        """Test that is_finalized defaults to False."""
        staff = AccountFactory(is_staff=True)
        report = DailyFinancialReportFactory(generated_by=staff)
        assert not report.is_finalized

    def test_daily_financial_report_unique_report_date(self):
        """Test that report_date must be unique."""
        staff = AccountFactory(is_staff=True)
        date = timezone.now().date()

        # Create first report
        DailyFinancialReportFactory(report_date=date, generated_by=staff)

        # Try to create duplicate report for same date
        with pytest.raises(IntegrityError):
            DailyFinancialReportFactory(report_date=date, generated_by=staff)

    def test_daily_financial_report_decimal_precision(self):
        """Test that decimal fields store proper precision."""
        staff = AccountFactory(is_staff=True)
        report = DailyFinancialReportFactory(
            generated_by=staff,
            total_revenue=Decimal("123456.7890"),
            pos_total=Decimal("50000.1234"),
            gross_profit=Decimal("75000.9876"),
        )

        report.refresh_from_db()
        assert report.total_revenue == Decimal("123456.7890")
        assert report.pos_total == Decimal("50000.1234")
        assert report.gross_profit == Decimal("75000.9876")

    def test_daily_financial_report_relationship_with_user(self):
        """Test the foreign key relationship with generated_by user."""
        staff = AccountFactory(is_staff=True)
        report = DailyFinancialReportFactory(generated_by=staff)

        # Forward relationship
        assert report.generated_by == staff

    def test_daily_financial_report_set_null_on_user_delete(self):
        """Test that generated_by is set to null when user is deleted."""
        staff = AccountFactory(is_staff=True)
        report = DailyFinancialReportFactory(generated_by=staff)

        # Delete user
        staff.delete()
        report.refresh_from_db()

        # generated_by should be None
        assert report.generated_by is None

    def test_daily_financial_report_generated_at_auto_now_add(self):
        """Test that generated_at is automatically set on creation."""
        staff = AccountFactory(is_staff=True)
        before = timezone.now()
        report = DailyFinancialReportFactory(generated_by=staff)
        after = timezone.now()

        assert report.generated_at >= before
        assert report.generated_at <= after

    def test_daily_financial_report_notes_field_optional(self):
        """Test that notes field is optional."""
        staff = AccountFactory(is_staff=True)
        report = DailyFinancialReportFactory(generated_by=staff, notes="")
        assert report.notes == ""

    def test_daily_financial_report_notes_max_length(self):
        """Test that notes field respects max_length."""
        staff = AccountFactory(is_staff=True)
        long_notes = "A" * 512
        report = DailyFinancialReportFactory(generated_by=staff, notes=long_notes)
        assert len(report.notes) == 512

    def test_finalized_daily_financial_report_factory(self):
        """Test FinalizedDailyFinancialReportFactory creates finalized report."""
        staff = AccountFactory(is_staff=True)
        report = FinalizedDailyFinancialReportFactory(generated_by=staff)
        assert report.is_finalized

    def test_report_with_discrepancies_factory(self):
        """Test ReportWithDiscrepanciesFactory creates report with discrepancies."""
        staff = AccountFactory(is_staff=True)
        report = ReportWithDiscrepanciesFactory(generated_by=staff)

        # Should have discrepancies
        assert report.pos_discrepancy != Decimal("0")
        assert report.cash_discrepancy != Decimal("0")

    def test_daily_financial_report_str_method(self):
        """Test string representation of daily financial report."""
        staff = AccountFactory(is_staff=True)
        report = DailyFinancialReportFactory(generated_by=staff)
        str_repr = str(report)
        assert "Financial Report" in str_repr
        assert isinstance(str_repr, str)

    def test_daily_financial_report_jalali_report_date_property(self):
        """Test that jalali_report_date returns a Persian date string."""
        staff = AccountFactory(is_staff=True)
        report = DailyFinancialReportFactory(generated_by=staff)
        jalali_date = report.jalali_report_date
        assert isinstance(jalali_date, str)
        assert len(jalali_date) > 0

    def test_daily_financial_report_ordering(self):
        """Test that reports are ordered by report_date descending."""
        staff = AccountFactory(is_staff=True)
        today = timezone.now().date()

        report1 = DailyFinancialReportFactory(
            report_date=today - timezone.timedelta(days=2), generated_by=staff
        )
        report2 = DailyFinancialReportFactory(
            report_date=today - timezone.timedelta(days=1), generated_by=staff
        )
        report3 = DailyFinancialReportFactory(report_date=today, generated_by=staff)

        reports = DailyFinancialReport.objects.all()
        assert reports[0] == report3  # Most recent first
        assert reports[1] == report2
        assert reports[2] == report1

    def test_daily_financial_report_verbose_name(self):
        """Test model verbose name is set correctly."""
        assert DailyFinancialReport._meta.verbose_name == "Daily Financial Report"
        assert (
            DailyFinancialReport._meta.verbose_name_plural == "Daily Financial Reports"
        )

    def test_daily_financial_report_generated_by_optional(self):
        """Test that generated_by can be null."""
        report = DailyFinancialReportFactory(generated_by=None)
        assert report.generated_by is None

    def test_daily_financial_report_discrepancy_tracking(self):
        """Test that discrepancy fields work correctly."""
        staff = AccountFactory(is_staff=True)
        report = DailyFinancialReportFactory(
            generated_by=staff,
            pos_discrepancy=Decimal("-5000.0000"),  # Short
            cash_discrepancy=Decimal("2000.0000"),  # Over
            card_to_card_discrepancy=Decimal("0"),
        )

        assert report.pos_discrepancy == Decimal("-5000.0000")
        assert report.cash_discrepancy == Decimal("2000.0000")
        assert report.card_to_card_discrepancy == Decimal("0")
