from apps.sale.models import DailyReport
from apps.sale.policies import can_approve_daily_report
from django.db import transaction
from django.utils import timezone


class ApproveDailyReportService:
    """
    Approves a submitted daily report.

    Process:
    1. Validates report is SUBMITTED or DISPUTED
    2. Validates manager is not approving their own report
    3. Changes status to APPROVED
    4. Records approval timestamp and approver

    Rules:
        - Report must be SUBMITTED or DISPUTED
        - Manager cannot approve their own report
        - After approval, can proceed to CLOSED
    """

    @classmethod
    @transaction.atomic
    def execute(
        cls,
        *,
        report: DailyReport,
        approved_by,
    ) -> DailyReport:
        """
        Approve a daily report.

        Args:
            report: The daily report to approve
            approved_by: Manager approving the report

        Returns:
            DailyReport: Updated report with APPROVED status

        Raises:
            PermissionDenied: If user lacks permission or report status is invalid
        """
        can_approve_daily_report(approved_by, report)

        # Update status
        report.status = DailyReport.ReportStatus.APPROVED
        report.approved_by = approved_by
        report.approved_at = timezone.now()
        report.save(update_fields=["status", "approved_by", "approved_at"])

        return report
