from apps.sale.models import DailyReport
from apps.sale.policies import can_dispute_daily_report
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _


class DisputeDailyReportService:
    """
    Marks a submitted daily report as disputed.

    Process:
    1. Validates report is SUBMITTED
    2. Changes status to DISPUTED
    3. Requires dispute reason

    Rules:
        - Report must be SUBMITTED
        - Dispute reason must be provided
        - Accountant needs to address issues before resubmitting
    """

    @classmethod
    @transaction.atomic
    def execute(
        cls,
        *,
        report: DailyReport,
        disputed_by,
        dispute_reason: str,
    ) -> DailyReport:
        """
        Dispute a daily report.

        Args:
            report: The daily report to dispute
            disputed_by: Manager disputing the report
            dispute_reason: Reason for dispute

        Returns:
            DailyReport: Updated report with DISPUTED status

        Raises:
            PermissionDenied: If user lacks permission or report status is invalid
            ValidationError: If dispute reason is missing
        """
        can_dispute_daily_report(disputed_by, report)

        # Validate dispute reason is provided
        if not dispute_reason or not dispute_reason.strip():
            raise ValidationError(_("Dispute reason is required"))

        # Add dispute reason to notes
        dispute_note = f"\n\n--- DISPUTED by {disputed_by.get_full_name() or disputed_by.username} ---\n{dispute_reason}"
        report.notes = (report.notes or "") + dispute_note

        # Update status
        report.status = DailyReport.ReportStatus.DISPUTED
        report.save(update_fields=["status", "notes"])

        return report
