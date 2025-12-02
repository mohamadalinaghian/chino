from __future__ import annotations

from datetime import date
from decimal import Decimal

from apps.inventory.models import PurchaseInvoice
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F, Q, Sum
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from ..models import DailyFinancialReport, SaleInvoice, Transaction

UserModel = get_user_model()


class FinancialReportService:
    """
    Generate end-of-day financial reports:
    - Revenue calculations
    - COGS tracking
    - Payment method breakdown
    - Discrepancy detection
    - Profit analysis
    """

    # ========== REPORT GENERATION ========== #

    @staticmethod
    @transaction.atomic
    def generate_daily_report(
        report_date: date,
        generated_by: UserModel,
        notes: str = "",
    ) -> DailyFinancialReport:
        """
        Generate comprehensive daily financial report.

        Args:
            report_date: Date to generate report for
            generated_by: User generating the report
            notes: Optional notes

        Returns:
            Created DailyFinancialReport

        Raises:
            ValidationError: If report already exists for this date
        """
        # Check if report already exists
        if DailyFinancialReport.objects.filter(report_date=report_date).exists():
            raise ValidationError(_(f"Report already exists for {report_date}"))

        # Calculate all metrics
        revenue_data = FinancialReportService._calculate_revenue(report_date)
        expense_data = FinancialReportService._calculate_expenses(report_date)
        cogs_data = FinancialReportService._calculate_cogs(report_date)

        # Calculate profits
        gross_profit = revenue_data["total_revenue"] - cogs_data["total_cogs"]
        net_profit = gross_profit - expense_data["operational_expenses"]

        # Create report
        report = DailyFinancialReport.objects.create(
            report_date=report_date,
            generated_by=generated_by,
            notes=notes,
            # Revenue
            total_revenue=revenue_data["total_revenue"],
            pos_total=revenue_data["pos_total"],
            cash_total=revenue_data["cash_total"],
            card_transfer_total=revenue_data["card_transfer_total"],
            # Expenses
            purchase_expenses=expense_data["purchase_expenses"],
            operational_expenses=expense_data["operational_expenses"],
            total_cogs=cogs_data["total_cogs"],
            # Profits
            gross_profit=gross_profit,
            net_profit=net_profit,
            # Discrepancies (set to 0 initially, updated manually if needed)
            pos_discrepancy=Decimal("0"),
            cash_discrepancy=Decimal("0"),
            card_to_card_discrepancy=Decimal("0"),
        )

        return report

    @staticmethod
    def _calculate_revenue(report_date: date) -> dict:
        """Calculate total revenue by payment method"""
        start = timezone.datetime.combine(report_date, timezone.datetime.min.time())
        end = timezone.datetime.combine(report_date, timezone.datetime.max.time())

        # Only count verified payments from PAID invoices
        payments = Transaction.objects.filter(
            payment_date__range=(start, end),
            invoice__bill_status=SaleInvoice.BillStatus.PAID,
        ).aggregate(
            total=Sum("amount"),
            pos=Sum("amount", filter=Q(payment_type=Transaction.PaymentType.POS)),
            cash=Sum("amount", filter=Q(payment_type=Transaction.PaymentType.CASH)),
            card=Sum(
                "amount", filter=Q(payment_type=Transaction.PaymentType.CARD_TO_CARD)
            ),
        )

        return {
            "total_revenue": payments["total"] or Decimal("0"),
            "pos_total": payments["pos"] or Decimal("0"),
            "cash_total": payments["cash"] or Decimal("0"),
            "card_transfer_total": payments["card"] or Decimal("0"),
        }

    @staticmethod
    def _calculate_expenses(report_date: date) -> dict:
        """Calculate expenses for the day"""
        # Purchase expenses
        purchase_total = PurchaseInvoice.objects.filter(
            issue_date=report_date
        ).aggregate(total=Sum(F("items__quantity") * F("items__purchased_unit_price")))[
            "total"
        ] or Decimal(
            "0"
        )

        # Operational expenses (implement based on your expense tracking)
        # This could be from another model like OperationalExpense
        # TODO: Implement if you have expense model
        operational_total = Decimal("0")

        return {
            "purchase_expenses": purchase_total,
            "operational_expenses": operational_total,
        }

    @staticmethod
    def _calculate_cogs(report_date: date) -> dict:
        """Calculate cost of goods sold from sale items"""
        start = timezone.datetime.combine(report_date, timezone.datetime.min.time())
        end = timezone.datetime.combine(report_date, timezone.datetime.max.time())

        # Sum material costs from sold items (only PAID invoices)
        cogs = SaleInvoice.objects.filter(
            issue_date__range=(start, end),
            bill_status=SaleInvoice.BillStatus.PAID,
        ).aggregate(total=Sum("items__material_cost"))["total"] or Decimal("0")

        return {
            "total_cogs": cogs,
        }

    # ========== REPORT MANAGEMENT ========== #

    @staticmethod
    @transaction.atomic
    def finalize_report(
        report: DailyFinancialReport,
        finalized_by: UserModel,
    ) -> None:
        """
        Mark report as finalized (cannot be modified after this).

        Args:
            report: Report to finalize
            finalized_by: User finalizing the report

        Raises:
            ValidationError: If already finalized
        """
        if report.is_finalized:
            raise ValidationError(_("Report already finalized"))

        report.is_finalized = True
        report.notes += f"\n[FINALIZED by {finalized_by.name}]"
        report.save(update_fields=["is_finalized", "notes"])

    @staticmethod
    def update_discrepancies(
        report: DailyFinancialReport,
        actual_pos: Decimal | None = None,
        actual_cash: Decimal | None = None,
        actual_card_to_card: Decimal | None = None,
    ) -> None:
        """
        Update discrepancies based on actual counted amounts.

        Args:
            report: The daily report to update
            actual_pos: Actual POS terminal amount counted
            actual_cash: Actual cash register amount counted
            actual_card_to_card: Actual card transfer amount counted

        Example:
            System says: POS = 1,000,000
            Staff counted: POS = 980,000
            Discrepancy: -20,000 (short)
        """
        if report.is_finalized:
            raise ValidationError(_("Cannot modify finalized report"))

        if actual_pos is not None:
            # Calculate discrepancy: actual - system
            report.pos_discrepancy = actual_pos - report.pos_total

        if actual_cash is not None:
            report.cash_discrepancy = actual_cash - report.cash_total

        if actual_card_to_card is not None:
            report.card_to_card_discrepancy = (
                actual_card_to_card - report.card_transfer_total
            )

        report.save(
            update_fields=[
                "pos_discrepancy",
                "cash_discrepancy",
                "card_to_card_discrepancy",
            ]
        )

    # ========== ANALYTICS ========== #

    @staticmethod
    def get_period_summary(start_date: date, end_date: date) -> dict:
        """
        Get financial summary for a date range.

        Returns:
            Dictionary with totals, averages, and trends
        """
        reports = DailyFinancialReport.objects.filter(
            report_date__range=(start_date, end_date)
        )

        totals = reports.aggregate(
            total_revenue=Sum("total_revenue"),
            total_cogs=Sum("total_cogs"),
            total_expenses=Sum("purchase_expenses") + Sum("operational_expenses"),
            total_gross_profit=Sum("gross_profit"),
            total_net_profit=Sum("net_profit"),
        )

        days_count = (end_date - start_date).days + 1

        return {
            "period": {
                "start": start_date,
                "end": end_date,
                "days": days_count,
            },
            "totals": totals,
            "averages": {
                "daily_revenue": (
                    totals["total_revenue"] / days_count
                    if days_count > 0
                    else Decimal("0")
                ),
                "daily_profit": (
                    totals["total_net_profit"] / days_count
                    if days_count > 0
                    else Decimal("0")
                ),
            },
        }

    @staticmethod
    def get_best_selling_products(start_date: date, end_date: date, limit: int = 10):
        """Get top-selling products for a period"""
        from apps.inventory.models import Product
        from django.db.models import Count

        start_dt = timezone.datetime.combine(start_date, timezone.datetime.min.time())
        end_dt = timezone.datetime.combine(end_date, timezone.datetime.max.time())

        return (
            Product.objects.filter(
                sale_items__sale_invoice__issue_date__range=(start_dt, end_dt),
                sale_items__sale_invoice__bill_status=SaleInvoice.BillStatus.PAID,
            )
            .annotate(
                total_qty=Sum("sale_items__quantity"),
                total_revenue=Sum(
                    F("sale_items__unit_price") * F("sale_items__quantity")
                    - F("sale_items__discount_amount")
                ),
                orders_count=Count("sale_items"),
            )
            .order_by("-total_revenue")[:limit]
        )

    @staticmethod
    def get_profit_margin_analysis(report: DailyFinancialReport) -> dict:
        """Calculate various profit margins for a report"""
        if report.total_revenue == 0:
            return {
                "gross_margin": Decimal("0"),
                "net_margin": Decimal("0"),
                "markup": Decimal("0"),
            }

        gross_margin = (report.gross_profit / report.total_revenue) * 100
        net_margin = (report.net_profit / report.total_revenue) * 100
        markup = (
            (report.gross_profit / report.total_cogs) * 100
            if report.total_cogs > 0
            else Decimal("0")
        )

        return {
            "gross_margin": gross_margin.quantize(Decimal("0.01")),
            "net_margin": net_margin.quantize(Decimal("0.01")),
            "markup": markup.quantize(Decimal("0.01")),
        }
