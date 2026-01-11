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
