from datetime import date
from decimal import Decimal
from typing import Optional

from ninja import Schema


class CreateReportRequest(Schema):
    """
    Request for daily report creation.
    """

    report_date: date
    open_floating_cash: int = 0
    closing_cash_counted: int = 0
    pos_report: Decimal = Decimal("0")
    note: Optional[str]


class CreateReportResponse(Schema):
    id: int
    state: str


class ReportDetailsResponse(Schema):
    """
    Details of a daily report.
    """

    report_date: str
    creator: str
    status: str
    opening_float: int
    closing_cash_counted: int
    expected_total_sales: int
    expected_total_refunds: int
    expected_total_discount: Decimal
    expected_total_tax: Decimal
    expected_cash_total: int
    cogs: Decimal
    total_expenses: Decimal
    notes: Optional[str]
    approved_by: Optional[str]
    total_revenue: Decimal
    net_profit: Decimal
    actual_income: Decimal
    actual_pos_total: Decimal
    net_cash_received: int
    cash_variance: int
    pos_variance: Decimal
    card_transfer_variance: int
    total_variance: Decimal


class SyncDailyReportRequest(Schema):
    """
    Modify DRAFT report.
    """

    id: int
    report_date: date
    open_floating_cash: int
    closing_cash_counted: int
    pos_report: Decimal
    note: Optional[str]


class ApproveReportRequest(Schema):
    id: int
