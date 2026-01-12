from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Optional

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
    def _get_day_report(report_id: int) -> DailyReport:
        return DailyReport.objects.get(id=report_id)

    @staticmethod
    def _get_pos_report(report_id: int) -> DailyReportPaymentMethod:
        return DailyReportPaymentMethod.objects.get(
            daily_report=report_id, payment_method=SalePayment.PaymentMethod.POS
        )

    @classmethod
    def modify_report(
        cls,
        user,
        report: DailyReport,
        date: Optional[date],
        opening_float: Optional[int],
        closing_cash: Optional[int],
        pos_report: Optional[Decimal],
    ) -> DailyReport:
        cls._can_modify_report(user, report)

        is_changed = False
        report = cls._get_day_report(report.pk)
        if opening_float is not None and opening_float >= 0:
            report.opening_float = opening_float
            is_changed = True
        elif closing_cash is not None and closing_cash >= 0:
            report.closing_cash_counted = closing_cash
            is_changed = True
        elif date is not None and date:
            report.report_date = date
            is_changed = True

        if pos_report is not None and pos_report >= 0:
            pos = cls._get_pos_report(report.pk)
            pos.actual_amount = pos_report
            pos.save()

        if is_changed:
            report.save()

        return report
