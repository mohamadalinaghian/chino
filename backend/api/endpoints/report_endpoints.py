from ninja import Router

from ..schemas.report_schemas import CreateReportRequest, CreateReportResponse
from ..security.auth import jwt_auth

router = Router(tags=["Sales"], auth=jwt_auth)


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
