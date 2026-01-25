"""
Report endpoints for daily report management.

Endpoints:
- POST /report/create - Create a new daily report
- GET /report/{id} - Get report details
- GET /report/ - List all reports
- POST /report/{id}/sync - Modify a draft report
- POST /report/{id}/approve - Approve a report
"""

from typing import List, Optional

from api.schemas.report_schemas import (
    CreateReportRequest,
    CreateReportResponse,
    ReportDetailsResponse,
    SyncDailyReportRequest,
)
from api.security.auth import jwt_auth
from apps.sale.models import DailyReport
from apps.sale.policies import can_view_daily_report
from apps.sale.services.report.approve_daily_report_service import (
    ApproveDailyReportService,
)
from apps.sale.services.report.create_daily_report_service import (
    CreateDailyReportService,
)
from apps.sale.services.report.modify_daily_report_service import (
    ModifyDailyReportService,
)
from django.core.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
from ninja import Router, Schema

router = Router(tags=["Reports"], auth=jwt_auth)


class ErrorResponse(Schema):
    detail: str


class ReportListItemSchema(Schema):
    id: int
    report_date: str
    status: str
    created_by: str
    total_revenue: str
    total_variance: str


class ReportListResponse(Schema):
    reports: List[ReportListItemSchema]
    total_count: int


# ---------------------------------------------------------------------
# Create Daily Report
# ---------------------------------------------------------------------


@router.post("/create", response={200: CreateReportResponse, 422: ErrorResponse})
def create_daily_report(request, payload: CreateReportRequest):
    """
    Creates a new daily report with auto-calculated expected amounts.

    The service automatically calculates:
    - Expected sales, refunds, discounts, tax from system records
    - Expected amounts by payment method (CASH, POS, CARD_TRANSFER)
    - COGS from inventory system

    User provides:
    - Report date
    - Opening float (cash at start of day)
    - Closing cash counted
    - POS total from device report
    """
    try:
        report = CreateDailyReportService.execute(
            created_by=request.auth,
            report_date=payload.report_date,
            opening_float=payload.open_floating_cash,
            closing_cash_counted=payload.closing_cash_counted,
            pos_total_report=payload.pos_report,
            notes=payload.note,
        )
    except PermissionDenied as e:
        return 422, {"detail": str(e)}
    except ValidationError as e:
        return 422, {"detail": str(e)}

    return CreateReportResponse(id=report.pk, state=report.status)


# ---------------------------------------------------------------------
# Get Report Details
# ---------------------------------------------------------------------


@router.get(
    "/{report_id}/details", response={200: ReportDetailsResponse, 422: ErrorResponse}
)
def get_report_details(request, report_id: int):
    """
    Fetches the full details of a daily report.

    Includes:
    - Revenue breakdown (sales, refunds, discounts, tax)
    - Cost breakdown (COGS, expenses)
    - Payment method reconciliation (expected vs actual)
    - Variance calculations
    """
    try:
        can_view_daily_report(request.auth)
    except PermissionDenied as e:
        return 422, {"detail": str(e)}

    report = get_object_or_404(DailyReport, id=report_id)

    return ReportDetailsResponse(
        report_date=report.jalali_report_date,
        creator=report.created_by.get_full_name() or report.created_by.username,
        status=report.status,
        opening_float=report.opening_float,
        closing_cash_counted=report.closing_cash_counted,
        expected_total_sales=report.expected_total_sales,
        expected_total_refunds=report.expected_total_refunds,
        expected_total_discount=report.expected_total_discounts,
        expected_total_tax=report.expected_total_tax,
        expected_cash_total=report.expected_cash_total,
        cogs=report.cost_of_goods_sold,
        total_expenses=report.total_expenses,
        notes=report.notes,
        approved_by=(
            report.approved_by.get_full_name() or report.approved_by.username
            if report.approved_by
            else None
        ),
        total_revenue=report.total_revenue,
        net_profit=report.net_profit,
        actual_income=report.actual_income,
        actual_pos_total=report.actual_pos_total,
        net_cash_received=report.net_cash_received,
        cash_variance=report.cash_variance,
        pos_variance=report.pos_variance,
        card_transfer_variance=report.card_transfer_variance,
        total_variance=report.total_variance,
    )


# ---------------------------------------------------------------------
# List Reports
# ---------------------------------------------------------------------


@router.get("/", response={200: ReportListResponse, 422: ErrorResponse})
def list_reports(request, status: Optional[str] = None, limit: int = 30):
    """
    Lists daily reports with optional filtering.

    Query params:
    - status: Filter by status (DRAFT, APPROVED)
    - limit: Max number of reports to return (default: 30)
    """
    try:
        can_view_daily_report(request.auth)
    except PermissionDenied as e:
        return 422, {"detail": str(e)}

    qs = DailyReport.objects.select_related("created_by").order_by("-report_date")

    if status:
        qs = qs.filter(status=status.upper())

    qs = qs[:limit]

    reports = [
        ReportListItemSchema(
            id=report.pk,
            report_date=report.jalali_report_date,
            status=report.status,
            created_by=report.created_by.get_full_name() or report.created_by.username,
            total_revenue=str(report.total_revenue),
            total_variance=str(report.total_variance),
        )
        for report in qs
    ]

    return ReportListResponse(reports=reports, total_count=len(reports))


# ---------------------------------------------------------------------
# Modify Draft Report
# ---------------------------------------------------------------------


@router.post(
    "/{report_id}/sync", response={200: CreateReportResponse, 422: ErrorResponse}
)
def sync_daily_report(request, report_id: int, payload: SyncDailyReportRequest):
    """
    Modifies a DRAFT daily report.

    Only the creator of the report can modify it.
    Only user-provided data can be modified:
    - Report date
    - Opening float
    - Closing cash counted
    - POS report total
    """
    report = get_object_or_404(DailyReport, id=report_id)

    try:
        updated_report = ModifyDailyReportService.modify_report(
            user=request.auth,
            report=report,
            date=payload.report_date,
            opening_float=payload.open_floating_cash,
            closing_cash=payload.closing_cash_counted,
            pos_report=payload.pos_report,
        )
    except PermissionDenied as e:
        return 422, {"detail": str(e)}
    except ValidationError as e:
        return 422, {"detail": str(e)}

    return CreateReportResponse(id=updated_report.pk, state=updated_report.status)


# ---------------------------------------------------------------------
# Approve Report
# ---------------------------------------------------------------------


@router.post(
    "/{report_id}/approve", response={200: CreateReportResponse, 422: ErrorResponse}
)
def approve_daily_report(request, report_id: int):
    """
    Approves a daily report.

    Rules:
    - Report must be in DRAFT status
    - User cannot approve their own report
    - User must have approval permission
    """
    report = get_object_or_404(DailyReport, id=report_id)

    try:
        approved_report = ApproveDailyReportService.execute(
            report=report,
            approved_by=request.auth,
        )
    except PermissionDenied as e:
        return 422, {"detail": str(e)}
    except ValidationError as e:
        return 422, {"detail": str(e)}

    return CreateReportResponse(id=approved_report.pk, state=approved_report.status)
