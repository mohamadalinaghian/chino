from __future__ import annotations

from decimal import Decimal

from ...models import DailyReport, DailyReportPaymentMethod, SalePayment
from ...policies import can_modify_report


class ModifyDailyReportService:
    """
    Modification of DRAFT report goes from here
    Only DRAFT report can modify.
    Only data which user itself provide can modify.
    """

    @staticmethod
    def _can_modify_report(user, report: DailyReport):
        can_modify_report(user, report)

    @staticmethod
    def _get_day_report(report: DailyReport):
        # using filter for lazy query
        return DailyReport.objects.filter(id=report.pk)

    @staticmethod
    def _update_pos_report(report: DailyReport):
        return DailyReportPaymentMethod.objects.filter(
            daily_report=report, payment_method=SalePayment.PaymentMethod.POS
        )

    @classmethod
    def modify_report(
        cls,
        user,
        report: DailyReport,
        opening_float: int,
        closing_cash: int,
        pos_report: Decimal,
    ):
        cls._can_modify_report(user, report)
        if opening_float or closing_cash:
            cls._get_day_report(report).update(
                opening_float=opening_float, closing_cash_counted=closing_cash
            )

        if pos_report:
            cls._update_pos_report(report).update(actual_amount=pos_report)
