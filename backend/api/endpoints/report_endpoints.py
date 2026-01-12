from typing import Optional

from apps.sale.models.daily_report_model import DailyReport
from apps.sale.policies import can_view_daily_report
from apps.sale.services.report.approve_daily_report_service import (
    ApproveDailyReportService,
)
from apps.sale.services.report.modify_daily_report_service import (
    ModifyDailyReportService,
)
from django.shortcuts import get_object_or_404
from ninja import Router

from ..schemas.report_schemas import (
    CreateReportRequest,
    CreateReportResponse,
    ReportDetailsResponse,
    SyncDailyReportRequest,
)
from ..security.auth import jwt_auth

router = Router(tags=["Report"], auth=jwt_auth)


@router.post(
    "/create",
    response={
        200: CreateReportResponse,
    },
)
def create_report(request, payload: CreateReportRequest):
    """
    Creating daily report.
    """
    from apps.sale.services.report.create_daily_report_service import (
        CreateDailyReportService as DR,
    )

    report = DR.execute(
        created_by=request.auth,
        report_date=payload.report_date,
        opening_float=payload.open_floating_cash,
        closing_cash_counted=payload.closing_cash_counted,
        pos_total_report=payload.pos_report,
        notes=payload.note,
    )

    return CreateReportResponse(id=report.pk, state=report.status)


@router.get("/{report_id}/details", response={200: ReportDetailsResponse})
def get_report_details(request, report_id: int):
    can_view_daily_report(request.auth)

    report: Optional[DailyReport] = get_object_or_404(
        DailyReport.objects.select_related("created_by", "approved_by"),
        id=report_id,
    )
    return ReportDetailsResponse(
        report_date=report.jalali_report_date,
        creator=report.created_by.name,
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
        approved_by=report.approved_by.name if report.approved_by else None,
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


@router.post("/{report_id}/modify", response={200: ReportDetailsResponse})
def modify_daily_report(request, report_id: int, payload: SyncDailyReportRequest):
    report = get_object_or_404(
        DailyReport.objects.filter(status=DailyReport.ReportStatus.DRAFT), id=report_id
    )
    # Report not exists or not in DRAFT state.
    if not report:
        return 404

    report = ModifyDailyReportService.modify_report(
        request.auth,
        report,
        payload.report_date,
        payload.open_floating_cash,
        payload.closing_cash_counted,
        payload.pos_report,
    )

    return ReportDetailsResponse(
        report_date=report.jalali_report_date,
        creator=report.created_by.name,
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
        approved_by=report.approved_by.name if report.approved_by else None,
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


@router.post("/{report_id}/approved", response={200: ReportDetailsResponse})
def approved_daily_report(request, report_id: int):
    report = get_object_or_404(
        DailyReport.objects.filter(status=DailyReport.ReportStatus.DRAFT), id=report_id
    )
    report = ApproveDailyReportService.execute(report=report, approved_by=request.auth)

    return ReportDetailsResponse(
        report_date=report.jalali_report_date,
        creator=report.created_by.name,
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
        approved_by=report.approved_by.name if report.approved_by else None,
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
