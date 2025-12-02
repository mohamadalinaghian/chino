"""
Tests for FinancialReportService.

Covers:
- Daily report generation
- Revenue calculations
- Expense tracking
- Profit calculations
- Discrepancy management
- Report finalization
- Period analytics

IMPORTANT: Create paid invoices before generating reports.
"""

from datetime import timedelta
from decimal import Decimal

import pytest
from apps.inventory.models import Product
from apps.inventory.services import StockService
from apps.inventory.tests.factories import ProductFactory
from apps.sale.models import SaleInvoice
from apps.sale.services.financial_report import FinancialReportService
from apps.sale.services.payment import PaymentService
from apps.sale.services.sale_invoice import SaleInvoiceService
from apps.user.tests.factories import AccountFactory, BankAccountFactory
from django.core.exceptions import ValidationError
from django.utils import timezone


@pytest.mark.django_db
class TestFinancialReportService:
    """Test suite for FinancialReportService."""

    def setup_method(self):
        """Set up test data with paid invoices."""
        self.staff = AccountFactory(is_staff=True)
        self.bank_account = BankAccountFactory()
        self.today = timezone.now().date()

        self.product = ProductFactory(
            type=Product.ProductType.SELLABLE,
            is_active=True,
            is_stock_traceable=True,
        )

        StockService.add_to_stock(
            product=self.product,
            unit_price=Decimal("5000"),
            quantity=Decimal("1000.000"),
        )

    def _create_paid_invoice(self, amount, payment_type="POS"):
        """Helper to create a paid invoice."""
        items = [
            {
                "product": self.product,
                "quantity": Decimal("1.000"),
                "unit_price": amount,
                "discount_amount": Decimal("0"),
                "sale_method": "STOCK",
            }
        ]

        invoice = SaleInvoiceService.create_order(
            staff=self.staff,
            items=items,
        )

        if payment_type == "POS":
            PaymentService.create_pos_payment(
                invoice=invoice,
                amount=amount,
                target_account=self.bank_account,
                verified_by=self.staff,
            )
        elif payment_type == "CASH":
            PaymentService.create_cash_payment(
                invoice=invoice,
                amount=amount,
                verified_by=self.staff,
            )
        elif payment_type == "CARD_TO_CARD":
            PaymentService.create_card_transfer(
                invoice=invoice,
                amount=amount,
                destination_account=self.bank_account,
                verified_by=self.staff,
            )

        return invoice

    def test_generate_daily_report(self):
        """Test generating a basic daily financial report."""
        self._create_paid_invoice(Decimal("100000.0000"), "POS")
        self._create_paid_invoice(Decimal("50000.0000"), "CASH")

        report = FinancialReportService.generate_daily_report(
            report_date=self.today,
            generated_by=self.staff,
            notes="End of day report",
        )

        assert report.pk is not None
        assert report.report_date == self.today
        assert report.generated_by == self.staff
        assert not report.is_finalized
        assert report.total_revenue > Decimal("0")

    def test_report_unique_per_date(self):
        """Test that only one report can exist per date."""
        FinancialReportService.generate_daily_report(
            report_date=self.today,
            generated_by=self.staff,
        )

        with pytest.raises(ValidationError) as cm:
            FinancialReportService.generate_daily_report(
                report_date=self.today,
                generated_by=self.staff,
            )

        assert "already exists" in str(cm.value)

    def test_revenue_calculation_by_payment_type(self):
        """Test that revenue is correctly split by payment type."""
        self._create_paid_invoice(Decimal("100000.0000"), "POS")
        self._create_paid_invoice(Decimal("50000.0000"), "CASH")
        self._create_paid_invoice(Decimal("30000.0000"), "CARD_TO_CARD")

        report = FinancialReportService.generate_daily_report(
            report_date=self.today,
            generated_by=self.staff,
        )

        assert report.total_revenue == Decimal("180000.0000")
        assert report.pos_total == Decimal("100000.0000")
        assert report.cash_total == Decimal("50000.0000")
        assert report.card_transfer_total == Decimal("30000.0000")

    def test_cogs_calculation(self):
        """Test that COGS is correctly calculated from sale items."""
        self._create_paid_invoice(Decimal("100000.0000"))

        report = FinancialReportService.generate_daily_report(
            report_date=self.today,
            generated_by=self.staff,
        )

        assert report.total_cogs > Decimal("0")
        assert report.total_cogs < report.total_revenue

    def test_profit_calculations(self):
        """Test that gross and net profit are calculated correctly."""
        self._create_paid_invoice(Decimal("100000.0000"))

        report = FinancialReportService.generate_daily_report(
            report_date=self.today,
            generated_by=self.staff,
        )

        expected_gross = report.total_revenue - report.total_cogs
        expected_net = report.gross_profit - report.operational_expenses

        assert report.gross_profit == expected_gross
        assert report.net_profit == expected_net

    def test_report_only_includes_paid_invoices(self):
        """Test that only PAID invoices are included in revenue."""
        self._create_paid_invoice(Decimal("100000.0000"))

        items = [
            {
                "product": self.product,
                "quantity": Decimal("1.000"),
                "unit_price": Decimal("50000.0000"),
                "discount_amount": Decimal("0"),
                "sale_method": "STOCK",
            }
        ]
        SaleInvoiceService.create_order(
            staff=self.staff,
            items=items,
        )

        report = FinancialReportService.generate_daily_report(
            report_date=self.today,
            generated_by=self.staff,
        )

        assert report.total_revenue == Decimal("100000.0000")

    def test_finalize_report(self):
        """Test finalizing a report makes it immutable."""
        self._create_paid_invoice(Decimal("100000.0000"))
        report = FinancialReportService.generate_daily_report(
            report_date=self.today,
            generated_by=self.staff,
        )

        assert not report.is_finalized

        FinancialReportService.finalize_report(
            report=report,
            finalized_by=self.staff,
        )

        report.refresh_from_db()
        assert report.is_finalized
        assert "FINALIZED" in report.notes

    def test_cannot_finalize_already_finalized_report(self):
        """Test that finalized reports cannot be finalized again."""
        self._create_paid_invoice(Decimal("100000.0000"))
        report = FinancialReportService.generate_daily_report(
            report_date=self.today,
            generated_by=self.staff,
        )

        FinancialReportService.finalize_report(
            report=report,
            finalized_by=self.staff,
        )

        with pytest.raises(ValidationError) as cm:
            FinancialReportService.finalize_report(
                report=report,
                finalized_by=self.staff,
            )

        assert "already finalized" in str(cm.value)

    def test_update_discrepancies(self):
        """Test updating discrepancies with actual counted amounts."""
        self._create_paid_invoice(Decimal("100000.0000"), "POS")
        report = FinancialReportService.generate_daily_report(
            report_date=self.today,
            generated_by=self.staff,
        )

        FinancialReportService.update_discrepancies(
            report=report,
            actual_pos=Decimal("98000.0000"),
        )

        report.refresh_from_db()
        assert report.pos_discrepancy == Decimal("-2000.0000")

    def test_update_multiple_discrepancies(self):
        """Test updating discrepancies for all payment types."""
        self._create_paid_invoice(Decimal("100000.0000"), "POS")
        self._create_paid_invoice(Decimal("50000.0000"), "CASH")
        report = FinancialReportService.generate_daily_report(
            report_date=self.today,
            generated_by=self.staff,
        )

        FinancialReportService.update_discrepancies(
            report=report,
            actual_pos=Decimal("98000.0000"),
            actual_cash=Decimal("51000.0000"),
            actual_card_to_card=Decimal("0"),
        )

        report.refresh_from_db()
        assert report.pos_discrepancy == Decimal("-2000.0000")
        assert report.cash_discrepancy == Decimal("1000.0000")
        assert report.card_to_card_discrepancy == Decimal("0")

    def test_cannot_modify_finalized_report_discrepancies(self):
        """Test that discrepancies cannot be updated on finalized reports."""
        self._create_paid_invoice(Decimal("100000.0000"))
        report = FinancialReportService.generate_daily_report(
            report_date=self.today,
            generated_by=self.staff,
        )

        FinancialReportService.finalize_report(
            report=report,
            finalized_by=self.staff,
        )

        with pytest.raises(ValidationError) as cm:
            FinancialReportService.update_discrepancies(
                report=report,
                actual_pos=Decimal("95000.0000"),
            )

        assert "finalized" in str(cm.value).lower()

    def test_get_period_summary(self):
        """Test getting financial summary for a date range."""
        for i in range(3):
            day = self.today - timedelta(days=i)
            invoice_date = timezone.datetime.combine(day, timezone.datetime.min.time())

            [
                {
                    "product": self.product,
                    "quantity": Decimal("1.000"),
                    "unit_price": Decimal("100000.0000"),
                    "discount_amount": Decimal("0"),
                    "sale_method": "STOCK",
                }
            ]

            invoice = SaleInvoice.objects.create(
                staff=self.staff,
                issue_date=invoice_date,
                cached_total_amount=Decimal("100000.0000"),
                bill_status=SaleInvoice.BillStatus.OPEN,
            )

            from apps.sale.models import SaleItem

            SaleItem.objects.create(
                sale_invoice=invoice,
                product=self.product,
                quantity=Decimal("1.000"),
                unit_price=Decimal("100000.0000"),
            )

            PaymentService.create_pos_payment(
                invoice=invoice,
                amount=Decimal("100000.0000"),
                target_account=self.bank_account,
                verified_by=self.staff,
            )

            FinancialReportService.generate_daily_report(
                report_date=day,
                generated_by=self.staff,
            )

        start = self.today - timedelta(days=2)
        end = self.today
        summary = FinancialReportService.get_period_summary(start, end)

        assert summary["period"]["days"] == 3
        assert summary["totals"]["total_revenue"] > Decimal("0")

    def test_get_profit_margin_analysis(self):
        """Test profit margin calculations."""
        self._create_paid_invoice(Decimal("100000.0000"))
        rpt = FinancialReportService.generate_daily_report(
            report_date=self.today,
            generated_by=self.staff,
        )

        margins = FinancialReportService.get_profit_margin_analysis(rpt)

        assert "gross_margin" in margins
        assert "net_margin" in margins
        assert "markup" in margins

        assert margins["gross_margin"] > Decimal("0")
        assert margins["gross_margin"] < Decimal("100")

    def test_zero_revenue_margin_analysis(self):
        """Test margin analysis with zero revenue."""
        rpt = FinancialReportService.generate_daily_report(
            report_date=self.today,
            generated_by=self.staff,
        )

        margins = FinancialReportService.get_profit_margin_analysis(rpt)

        assert margins["gross_margin"] == Decimal("0")
        assert margins["net_margin"] == Decimal("0")

    def test_default_discrepancies_are_zero(self):
        """Test that discrepancies default to zero."""
        self._create_paid_invoice(Decimal("100000.0000"))
        rpt = FinancialReportService.generate_daily_report(
            report_date=self.today,
            generated_by=self.staff,
        )

        assert rpt.pos_discrepancy == Decimal("0")
        assert rpt.cash_discrepancy == Decimal("0")
        assert rpt.card_to_card_discrepancy == Decimal("0")
