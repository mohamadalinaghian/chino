from apps.sale.models import DailyReport
from apps.sale.policies import can_close_daily_report
from django.db import transaction
from django.utils import timezone


class CloseDailyReportService:
    """
    Finalizes/closes an approved daily report.

    Process:
    1. Validates report is APPROVED
    2. Changes status to CLOSED
    3. Records closure timestamp
    4. Report becomes immutable

    Rules:
        - Report must be APPROVED
        - After closure, report is permanently locked
        - No further changes allowed
    """

    @classmethod
    @transaction.atomic
    def execute(
        cls,
        *,
        report: DailyReport,
        closed_by,
    ) -> DailyReport:
        """
        Close/finalize a daily report.

        Args:
            report: The daily report to close
            closed_by: User closing the report

        Returns:
            DailyReport: Updated report with CLOSED status

        Raises:
            PermissionDenied: If user lacks permission or report status is invalid
        """
        can_close_daily_report(closed_by, report)

        # Update status
        report.status = DailyReport.ReportStatus.CLOSED
        report.closed_at = timezone.now()
        report.save(update_fields=["status", "closed_at"])

        return report
