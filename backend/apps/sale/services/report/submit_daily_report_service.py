from apps.sale.models import DailyReport
from apps.sale.policies import can_submit_daily_report
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class SubmitDailyReportService:
    """
    Submits a daily report for approval.

    Process:
    1. Validates report is in DRAFT status
    2. Validates all required fields are filled
    3. Validates payment methods have actual amounts entered
    4. Changes status to SUBMITTED
    5. Records submission timestamp

    Rules:
        - Report must be DRAFT
        - Closing cash must be entered
        - All payment methods must have actual amounts
        - Cannot edit after submission
    """

    @classmethod
    @transaction.atomic
    def execute(
        cls,
        *,
        report: DailyReport,
        submitted_by,
    ) -> DailyReport:
        """
        Submit a daily report for approval.

        Args:
            report: The daily report to submit
            submitted_by: User submitting the report

        Returns:
            DailyReport: Updated report with SUBMITTED status

        Raises:
            PermissionDenied: If user lacks permission or report is not DRAFT
            ValidationError: If required fields are missing
        """
        can_submit_daily_report(submitted_by, report)

        # Validate required fields
        cls._validate_report_completeness(report)

        # Update status
        report.status = DailyReport.ReportStatus.SUBMITTED
        report.submitted_at = timezone.now()
        report.save(update_fields=["status", "submitted_at"])

        return report

    @staticmethod
    def _validate_report_completeness(report: DailyReport) -> None:
        """
        Validate that all required fields are filled before submission.

        Args:
            report: The daily report to validate

        Raises:
            ValidationError: If required fields are missing or invalid
        """
        errors = []

        # Check closing cash is entered
        if report.closing_cash_counted <= 0:
            errors.append(
                _("Closing cash counted must be entered and greater than zero")
            )

        # Check all payment methods have actual amounts
        for pm in report.payment_methods.all():
            if pm.actual_amount < 0:
                errors.append(
                    _("Actual amount for %(method)s cannot be negative")
                    % {"method": pm.get_payment_method_display()}
                )

        # Check cost fields are non-negative
        if report.cost_of_goods_sold < 0:
            errors.append(_("Cost of goods sold cannot be negative"))

        if report.labor_costs < 0:
            errors.append(_("Labor costs cannot be negative"))

        if report.operating_expenses < 0:
            errors.append(_("Operating expenses cannot be negative"))

        # If there's a variance, reason should be provided
        if abs(report.total_variance) > 0.01 and not report.variance_reason.strip():
            errors.append(
                _(
                    "Variance reason is required when there is a discrepancy "
                    "(variance: %(variance)s)"
                )
                % {"variance": report.total_variance}
            )

        if errors:
            raise ValidationError(errors)
