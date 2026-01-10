from datetime import date, datetime, time, timedelta
from decimal import Decimal

from apps.inventory.models import PurchaseInvoice
from apps.sale.models import (
    DailyReport,
    DailyReportPaymentMethod,
    Sale,
    SalePayment,
    SaleRefund,
)
from apps.sale.models.sale_item import SaleItem
from apps.sale.policies import can_create_daily_report
from django.db import models, transaction
from django.utils import timezone


class CreateDailyReportService:
    """
    Creates a daily reconciliation report with auto-calculated expected amounts.

    Process:
    1. Calculate business day range (2 AM cutoff)
    2. Query all invoices, payments, refunds for the day
    3. Auto-calculate expected amounts by payment method
    4. Create report with payment method breakdown
    5. Allow accountant to enter actual amounts and costs

    Rules:
        - One report per business date
        - Expected amounts calculated from system records
        - Actual amounts entered manually by accountant
    """

    @classmethod
    @transaction.atomic
    def execute(
        cls,
        *,
        created_by,
        report_date: date,
        opening_float: int = 0,
        notes: str = "",
    ) -> DailyReport:
        """
        Create a new daily report.

        Args:
            created_by: User creating the report (accountant)
            report_date: Business date for this report
            opening_float: Cash in drawer at start of day
            notes: Additional notes

        Returns:
            DailyReport: Created report in DRAFT status
        """
        can_create_daily_report(created_by, report_date)

        # Calculate business day range (2 AM cutoff)
        day_start, day_end = cls._calculate_business_day_range(report_date)

        # Auto-calculate expected amounts from system
        expected_data = cls._calculate_expected_amounts(day_start, day_end)

        # Create the daily report
        report = DailyReport.objects.create(
            report_date=report_date,
            created_by=created_by,
            opening_float=opening_float,
            status=DailyReport.ReportStatus.DRAFT,
            # Revenue (auto-calculated)
            expected_total_sales=expected_data["total_sales"],
            expected_total_refunds=expected_data["total_refunds"],
            expected_total_discounts=expected_data["total_discounts"],
            expected_total_tax=expected_data["total_tax"],
            cost_of_goods_sold=expected_data["cogs"],
            total_expenses=expected_data["expenses"],
            notes=notes,
            # Closing cash will be entered later by accountant
            closing_cash_counted=Decimal("0.0000"),
        )

        # Create payment method breakdown
        cls._create_payment_method_breakdown(report, expected_data["payment_methods"])

        return report

    @staticmethod
    def _calculate_business_day_range(report_date: date) -> tuple[datetime, datetime]:
        """
        Calculate datetime range for business day with 2 AM cutoff.

        Business day runs from 2 AM on report_date to 2 AM next day.

        Args:
            report_date: The business date

        Returns:
            tuple: (day_start, day_end) as timezone-aware datetimes
        """
        # Start at 2 AM on report_date
        day_start = timezone.make_aware(
            datetime.combine(report_date, time(hour=2, minute=0, second=0))
        )

        # End at 2 AM next day
        day_end = day_start + timedelta(days=1)

        return day_start, day_end

    @staticmethod
    def _calculate_expected_amounts(day_start: datetime, day_end: datetime) -> dict:
        """
        Calculate expected amounts from system records for the business day.

        Args:
            day_start: Start of business day.
            day_end: End of business day

        Returns:
            dict: Expected amounts including revenue and payment method breakdown
        """
        # Query sales for the day
        invoices = Sale.objects.filter(
            created_at__gte=day_start,
            created_at__lt=day_end,
            status=Sale.SaleState.CLOSED,
        )
        sold_items = SaleItem.objects.filter(sale_in=invoices)

        # Query payments for the day
        payments = SalePayment.objects.filter(
            received_at__gte=day_start,
            received_at__lt=day_end,
            status=SalePayment.PaymentStatus.COMPLETED,
        )

        # Query refunds for the day
        refunds = SaleRefund.objects.filter(
            processed_at__gte=day_start,
            processed_at__lt=day_end,
            status=SaleRefund.Status.COMPLETED,
        )

        expenses = PurchaseInvoice.objects.filter(
            issue_date__gte=day_start, issue_date__lt=day_end
        )

        # Calculate revenue totals
        total_sales = invoices.aggregate(total=models.Sum("total_amount"))[
            "total"
        ] or Decimal("0.0000")

        cogs = sold_items.aggregate(
            cogs=models.F("material_cost") * models.F("quantity")
        )["cogs"] or Decimal("0")

        total_discounts = invoices.aggregate(total=models.Sum("discount_amount"))[
            "total"
        ] or Decimal("0.0000")

        total_tax = invoices.aggregate(total=models.Sum("tax_amount"))[
            "total"
        ] or Decimal("0.0000")

        total_refunds = refunds.aggregate(total=models.Sum("amount"))[
            "total"
        ] or Decimal("0.0000")

        # Calculate payment method breakdown
        payment_methods = CreateDailyReportService._calculate_payment_method_totals(
            payments, refunds
        )

        return {
            "total_sales": total_sales,
            "total_refunds": total_refunds,
            "total_discounts": total_discounts,
            "total_tax": total_tax,
            "payment_methods": payment_methods,
            "cogs": cogs,
            "expenses": expenses,
        }

    @staticmethod
    def _calculate_payment_method_totals(payments, refunds) -> dict[str, Decimal]:
        """
        Calculate expected amounts by payment method.

        Args:
            payments: QuerySet of SalePayment for the day
            refunds: QuerySet of SaleRefund for the day

        Returns:
            dict: Payment method -> expected amount mapping
        """
        method_mapping = {
            "CASH": SalePayment.PaymentMethod.CASH,
            "POS": SalePayment.PaymentMethod.POS,
            "BANK_TRANSFER": SalePayment.PaymentMethod.CARD_TRANSFER,
        }

        payment_totals = {}

        # Sum payments by method (amount_applied only, not tips)
        for payment in payments:
            method = method_mapping.get(payment.method, SalePayment.PaymentMethod.CASH)
            if method not in payment_totals:
                payment_totals[method] = Decimal("0.0000")
            payment_totals[method] += payment.amount_applied

        # Subtract refunds by method
        for refund in refunds:
            method = method_mapping.get(refund.method, SalePayment.PaymentMethod.CASH)
            if method not in payment_totals:
                payment_totals[method] = Decimal("0.0000")
            payment_totals[method] -= refund.amount

        # Ensure all payment methods exist (even if zero)
        for method_type in SalePayment.PaymentMethod.values:
            if method_type not in payment_totals:
                payment_totals[method_type] = Decimal("0.0000")

        return payment_totals

    @staticmethod
    def _create_payment_method_breakdown(
        report: DailyReport, payment_methods: dict[str, Decimal]
    ) -> None:
        """
        Create DailyReportPaymentMethod records for each payment method.

        Args:
            report: The daily report
            payment_methods: Expected amounts by payment method
        """
        for method, expected_amount in payment_methods.items():
            DailyReportPaymentMethod.objects.create(
                daily_report=report,
                payment_method=method,
                expected_amount=expected_amount,
                actual_amount=Decimal("0.0000"),  # To be filled by accountant
                variance=Decimal("0.0000"),
            )
