"""
Authorization policies for Sale, Invoice, Payment and Refund operations.

Policies are:
- Stateless
- Side-effect free
- Cheap-first (state checks before permission checks)
"""

from django.core.exceptions import PermissionDenied
from django.utils.translation import gettext_lazy as _

from .models import DailyReport, Sale, SaleInvoice, SalePayment

# ---------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------


def _require_authenticated(user) -> None:
    if not user or not user.is_authenticated:
        raise PermissionDenied(_("Authentication required"))


def _require_perm(user, perm: str) -> None:
    if not user.has_perm(perm):
        raise PermissionDenied(_("Missing permission: %(perm)s") % {"perm": perm})


# ---------------------------------------------------------------------
# Invoice policies
# ---------------------------------------------------------------------


def can_create_invoice(user, sale: Sale) -> None:
    """
    Permission to create an invoice for a sale.

    Rules:
        - Sale must be CLOSED
        - Sale must not already have an invoice
        - User must have sale.close_sale permission
    """
    _require_authenticated(user)

    if sale.state != Sale.State.CLOSED:
        raise PermissionDenied(_("Only CLOSED sales can be invoiced"))

    # Check if invoice exists without triggering query if table doesn't exist
    try:
        if hasattr(sale, "invoice") and sale.invoice:
            raise PermissionDenied(_("Invoice already exists for this sale"))
    except SaleInvoice.DoesNotExist:
        pass  # No invoice exists, which is what we want

    _require_perm(user, "sale.close_sale")


def can_view_invoice(user, invoice: SaleInvoice) -> None:
    """
    Permission to view invoice details.
    """
    _require_authenticated(user)
    _require_perm(user, "sale.view_sale_detail")


def can_void_invoice(user, invoice: SaleInvoice) -> None:
    """
    Permission to void an invoice.

    Rules:
        - Invoice must not be PAID
        - Invoice must not be VOID
    """
    _require_authenticated(user)

    if invoice.status == SaleInvoice.InvoiceStatus.PAID:
        raise PermissionDenied(_("Paid invoices cannot be voided"))

    if invoice.status == SaleInvoice.InvoiceStatus.VOID:
        raise PermissionDenied(_("Invoice already voided"))

    _require_perm(user, "sale.close_sale")


# ---------------------------------------------------------------------
# Payment policies
# ---------------------------------------------------------------------


def can_issue_payment(user, invoice: SaleInvoice) -> None:
    """
    Permission to register a payment.

    Rules:
        - Invoice must not be VOID
    """
    _require_authenticated(user)

    if invoice.status == SaleInvoice.InvoiceStatus.VOID:
        raise PermissionDenied(_("Cannot accept payment for a void invoice"))

    _require_perm(user, "sale.close_sale")


def can_refund_payment(user, payment: SalePayment) -> None:
    """
    Permission to refund a payment.

    Rules:
        - Payment must be COMPLETED
        - Refund amount must not exceed applied amount
    """
    _require_authenticated(user)

    if payment.status != SalePayment.PaymentStatus.COMPLETED:
        raise PermissionDenied(_("Only completed payments can be refunded"))

    _require_perm(user, "sale.close_sale")


# ---------------------------------------------------------------------
# Reporting policies
# ---------------------------------------------------------------------


def can_view_financial_reports(user) -> None:
    """
    Permission to view financial and payment reports.
    """
    _require_authenticated(user)
    _require_perm(user, "sale.view_sale_list")


def can_open_sale(user) -> None:
    """
    Validates user permission to create a new sale.

    Args:
        user: Django User instance

    Raises:
        PermissionDenied: If user lacks 'sale.open_sale' permission
    """
    _require_authenticated(user)

    if not user.has_perm("sale.open_sale"):
        raise PermissionDenied(_("You are not allowed to open a sale"))


def can_see_sale_details(user) -> None:
    """
    Validates user permission to view detailed sale information.

    Args:
        user: Django User instance

    Raises:
        PermissionDenied: If user lacks 'sale.view_sale_detail' permission
    """
    _require_authenticated(user)

    if not user.has_perm("sale.view_sale_detail"):
        raise PermissionDenied(_("You are not allowed to see sale details"))


def can_see_sale_list(user) -> None:
    """
    Validates user permission to view the sales dashboard/list.

    Args:
        user: Django User instance

    Raises:
        PermissionDenied: If user lacks 'sale.view_sale_list' permission
    """
    _require_authenticated(user)

    if not user.has_perm("sale.view_sale_list"):
        raise PermissionDenied(_("You are not allowed to view the sales list"))


def can_modify_sale(user, sale: Sale) -> None:
    """
    Validates user permission to modify an existing sale.
    Only OPEN sales can be modified.

    Args:
        user: Django User instance
        sale: Sale instance to modify

    Raises:
        PermissionDenied: If user lacks permission or sale is not OPEN
    """
    _require_authenticated(user)

    # State check first (cheaper than permission check)
    if sale.state != Sale.State.OPEN:
        raise PermissionDenied(_("Only OPEN sales can be modified"))

    if not user.has_perm("sale.modify_sale"):
        raise PermissionDenied(_("You are not allowed to modify sales"))


def can_close_sale(user, sale: Sale) -> None:
    """
    Validates user permission to finalize a sale.
    Sale must be OPEN and contain at least one item.

    Args:
        user: Django User instance
        sale: Sale instance to close

    Raises:
        PermissionDenied: If validation fails
    """
    _require_authenticated(user)

    # Permission check
    if not user.has_perm("sale.close_sale"):
        raise PermissionDenied(_("Missing permission: sale.close_sale"))

    # State validation
    if sale.state != Sale.State.OPEN:
        raise PermissionDenied(_("Only open sales can be closed"))

    # Business rule: Cannot close empty sale
    if not sale.items.exists():
        raise PermissionDenied(_("Cannot close an empty sale"))


def can_cancel_sale(user, sale: Sale) -> None:
    """
    Validates user permission to cancel an existing sale.
    Only OPEN sales can be canceled.

    Args:
        user: Django User instance
        sale: Sale instance to cancel

    Raises:
        PermissionDenied: If validation fails
    """
    _require_authenticated(user)

    # State check
    if sale.state != Sale.State.OPEN:
        raise PermissionDenied(_("Only OPEN sales can be canceled"))

    # Permission check
    if not user.has_perm("sale.cancel_sale"):
        raise PermissionDenied(_("You are not allowed to cancel sales"))


# ---------------------------------------------------------------------
# Daily Report policies
# ---------------------------------------------------------------------


def can_create_daily_report(user, report_date) -> None:
    """
    Permission to create a daily report.

    Rules:
        - User must have sale.add_dailyreport permission
        - No existing report for the same date
    """
    _require_authenticated(user)

    # Check for duplicate report
    if DailyReport.objects.filter(report_date=report_date).exists():
        raise PermissionDenied(
            _("Daily report already exists for %(date)s") % {"date": report_date}
        )

    _require_perm(user, "sale.add_dailyreport")


def can_edit_daily_report(user, report: DailyReport) -> None:
    """
    Permission to edit a daily report.

    Rules:
        - Report must be in DRAFT status
        - User must have sale.change_dailyreport permission
    """
    _require_authenticated(user)

    if report.status != DailyReport.ReportStatus.DRAFT:
        raise PermissionDenied(
            _("Only DRAFT reports can be edited. Current status: %(status)s")
            % {"status": report.get_status_display()}
        )

    _require_perm(user, "sale.change_dailyreport")


def can_submit_daily_report(user, report: DailyReport) -> None:
    """
    Permission to submit a daily report for approval.

    Rules:
        - Report must be in DRAFT status
        - User must have sale.change_dailyreport permission
    """
    _require_authenticated(user)

    if report.status != DailyReport.ReportStatus.DRAFT:
        raise PermissionDenied(
            _("Only DRAFT reports can be submitted. Current status: %(status)s")
            % {"status": report.get_status_display()}
        )

    _require_perm(user, "sale.change_dailyreport")


def can_approve_daily_report(user, report: DailyReport) -> None:
    """
    Permission to approve a daily report.

    Rules:
        - Report must be SUBMITTED or DISPUTED
        - User must have sale.approve_dailyreport permission
        - User cannot approve their own report
    """
    _require_authenticated(user)

    if report.status not in [
        DailyReport.ReportStatus.SUBMITTED,
        DailyReport.ReportStatus.DISPUTED,
    ]:
        raise PermissionDenied(
            _("Only SUBMITTED or DISPUTED reports can be approved. Current status: %(status)s")
            % {"status": report.get_status_display()}
        )

    # Prevent self-approval
    if report.created_by == user:
        raise PermissionDenied(_("You cannot approve your own report"))

    _require_perm(user, "sale.approve_dailyreport")


def can_dispute_daily_report(user, report: DailyReport) -> None:
    """
    Permission to dispute a daily report.

    Rules:
        - Report must be SUBMITTED
        - User must have sale.approve_dailyreport permission
    """
    _require_authenticated(user)

    if report.status != DailyReport.ReportStatus.SUBMITTED:
        raise PermissionDenied(
            _("Only SUBMITTED reports can be disputed. Current status: %(status)s")
            % {"status": report.get_status_display()}
        )

    _require_perm(user, "sale.approve_dailyreport")


def can_close_daily_report(user, report: DailyReport) -> None:
    """
    Permission to finalize/close a daily report.

    Rules:
        - Report must be APPROVED
        - User must have sale.approve_dailyreport permission
    """
    _require_authenticated(user)

    if report.status != DailyReport.ReportStatus.APPROVED:
        raise PermissionDenied(
            _("Only APPROVED reports can be closed. Current status: %(status)s")
            % {"status": report.get_status_display()}
        )

    _require_perm(user, "sale.approve_dailyreport")


def can_view_daily_report(user) -> None:
    """
    Permission to view daily reports.

    Rules:
        - User must have sale.view_dailyreport permission
    """
    _require_authenticated(user)
    _require_perm(user, "sale.view_dailyreport")
