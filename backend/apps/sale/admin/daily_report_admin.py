from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from ..models import CashDenomination, DailyReport, DailyReportPaymentMethod
from ..services import (
    ApproveDailyReportService,
    CloseDailyReportService,
    DisputeDailyReportService,
    SubmitDailyReportService,
)


class DailyReportPaymentMethodInline(admin.TabularInline):
    """Inline for daily report payment methods."""

    model = DailyReportPaymentMethod
    extra = 0
    fields = (
        "payment_method",
        "expected_amount",
        "actual_amount",
        "variance_display",
        "notes",
    )
    readonly_fields = ("expected_amount", "variance_display")

    def variance_display(self, obj):
        """Display variance with color."""
        if obj.pk:
            variance = obj.variance
            if abs(variance) < 0.01:
                color = "green"
                text = "Balanced"
            elif variance > 0:
                color = "blue"
                text = f"+{variance} (Overage)"
            else:
                color = "red"
                text = f"{variance} (Shortage)"

            return format_html(
                '<strong style="color: {};">{}</strong>',
                color,
                text
            )
        return "-"

    variance_display.short_description = _("Variance")

    def has_delete_permission(self, request, obj=None):
        """Prevent deleting payment methods."""
        return False


class CashDenominationInline(admin.TabularInline):
    """Inline for cash denominations."""

    model = CashDenomination
    extra = 3
    fields = (
        "denomination",
        "quantity",
        "total_amount",
    )
    readonly_fields = ("total_amount",)


@admin.register(DailyReport)
class DailyReportAdmin(admin.ModelAdmin):
    """Admin for DailyReport model - end-of-day reconciliation."""

    list_display = (
        "report_date",
        "status_badge",
        "total_revenue_display",
        "total_costs_display",
        "net_profit_display",
        "total_variance_display",
        "created_by",
        "approved_by",
    )

    list_filter = (
        "status",
        "report_date",
        "created_at",
    )

    search_fields = (
        "report_date",
        "created_by__username",
        "approved_by__username",
        "notes",
    )

    readonly_fields = (
        "status",
        "created_by",
        "approved_by",
        "created_at",
        "submitted_at",
        "approved_at",
        "closed_at",
        # Revenue (auto-calculated)
        "expected_total_sales",
        "expected_total_tips",
        "expected_total_refunds",
        "expected_total_discounts",
        "expected_total_tax",
        # Computed totals
        "total_revenue",
        "total_costs",
        "net_profit",
        "net_cash_received",
        "cash_variance_display",
        "total_variance_display",
        "financial_summary",
    )

    fieldsets = (
        (
            _("Report Information"),
            {
                "fields": (
                    "report_date",
                    "status",
                    "variance_reason",
                )
            },
        ),
        (
            _("Cash Float"),
            {
                "fields": (
                    "opening_float",
                    "closing_cash_counted",
                    "net_cash_received",
                    "cash_variance_display",
                )
            },
        ),
        (
            _("Revenue (Auto-calculated)"),
            {
                "fields": (
                    "expected_total_sales",
                    "expected_total_tips",
                    "expected_total_refunds",
                    "expected_total_discounts",
                    "expected_total_tax",
                )
            },
        ),
        (
            _("Costs (Manual Entry)"),
            {
                "fields": (
                    "cost_of_goods_sold",
                    "labor_costs",
                    "operating_expenses",
                )
            },
        ),
        (
            _("Financial Summary"),
            {
                "fields": (
                    "total_revenue",
                    "total_costs",
                    "net_profit",
                    "total_variance_display",
                    "financial_summary",
                ),
                "classes": ("wide",),
            },
        ),
        (
            _("Workflow"),
            {
                "fields": (
                    "created_by",
                    "created_at",
                    "submitted_at",
                    "approved_by",
                    "approved_at",
                    "closed_at",
                )
            },
        ),
        (
            _("Notes"),
            {
                "fields": ("notes",),
                "classes": ("collapse",),
            },
        ),
    )

    inlines = [DailyReportPaymentMethodInline, CashDenominationInline]

    date_hierarchy = "report_date"

    ordering = ("-report_date",)

    actions = [
        "submit_reports",
        "approve_reports",
        "dispute_reports",
        "close_reports",
    ]

    def status_badge(self, obj):
        """Display status with color badge."""
        colors = {
            DailyReport.ReportStatus.DRAFT: "gray",
            DailyReport.ReportStatus.SUBMITTED: "orange",
            DailyReport.ReportStatus.APPROVED: "green",
            DailyReport.ReportStatus.DISPUTED: "red",
            DailyReport.ReportStatus.CLOSED: "blue",
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            colors.get(obj.status, "gray"),
            obj.get_status_display(),
        )

    status_badge.short_description = _("Status")

    def total_revenue_display(self, obj):
        """Display total revenue."""
        if obj.pk:
            return format_html(
                '<strong style="color: green;">${:,.2f}</strong>',
                obj.total_revenue
            )
        return "-"

    total_revenue_display.short_description = _("Revenue")

    def total_costs_display(self, obj):
        """Display total costs."""
        if obj.pk:
            return format_html(
                '<strong style="color: red;">${:,.2f}</strong>',
                obj.total_costs
            )
        return "-"

    total_costs_display.short_description = _("Costs")

    def net_profit_display(self, obj):
        """Display net profit."""
        if obj.pk:
            profit = obj.net_profit
            color = "green" if profit >= 0 else "red"
            return format_html(
                '<strong style="color: {};">${:,.2f}</strong>',
                color,
                profit
            )
        return "-"

    net_profit_display.short_description = _("Net Profit")

    def total_variance_display(self, obj):
        """Display total variance with color."""
        if obj.pk:
            variance = obj.total_variance
            if abs(variance) < 0.01:
                color = "green"
                text = "Balanced"
            elif variance > 0:
                color = "blue"
                text = f"+${variance:,.2f}"
            else:
                color = "red"
                text = f"-${abs(variance):,.2f}"

            return format_html(
                '<strong style="color: {};">{}</strong>',
                color,
                text
            )
        return "-"

    total_variance_display.short_description = _("Variance")

    def cash_variance_display(self, obj):
        """Display cash variance with color."""
        if obj.pk:
            variance = obj.cash_variance
            if abs(variance) < 0.01:
                return format_html('<strong style="color: green;">Balanced</strong>')
            elif variance > 0:
                return format_html(
                    '<strong style="color: blue;">+${:,.2f} (Overage)</strong>',
                    variance
                )
            else:
                return format_html(
                    '<strong style="color: red;">-${:,.2f} (Shortage)</strong>',
                    abs(variance)
                )
        return "-"

    cash_variance_display.short_description = _("Cash Variance")

    def financial_summary(self, obj):
        """Display comprehensive financial summary."""
        if not obj.pk:
            return "-"

        html = '<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">'
        html += '<table style="width: 100%; border-collapse: collapse;">'

        # Revenue section
        html += '<tr style="background-color: #e0f7fa;"><th colspan="2" style="text-align: left; padding: 8px;">REVENUE</th></tr>'
        html += f'<tr><td style="padding: 5px;">Sales:</td><td style="text-align: right;"><strong>${obj.expected_total_sales:,.2f}</strong></td></tr>'
        html += f'<tr><td style="padding: 5px;">Tips:</td><td style="text-align: right;">${obj.expected_total_tips:,.2f}</td></tr>'
        html += f'<tr><td style="padding: 5px;">Refunds:</td><td style="text-align: right;">-${obj.expected_total_refunds:,.2f}</td></tr>'
        html += f'<tr><td style="padding: 5px;"><strong>Total Revenue:</strong></td><td style="text-align: right; color: green;"><strong>${obj.total_revenue:,.2f}</strong></td></tr>'

        # Costs section
        html += '<tr style="background-color: #ffebee;"><th colspan="2" style="text-align: left; padding: 8px;">COSTS</th></tr>'
        html += f'<tr><td style="padding: 5px;">COGS:</td><td style="text-align: right;">${obj.cost_of_goods_sold:,.2f}</td></tr>'
        html += f'<tr><td style="padding: 5px;">Labor:</td><td style="text-align: right;">${obj.labor_costs:,.2f}</td></tr>'
        html += f'<tr><td style="padding: 5px;">Operating:</td><td style="text-align: right;">${obj.operating_expenses:,.2f}</td></tr>'
        html += f'<tr><td style="padding: 5px;"><strong>Total Costs:</strong></td><td style="text-align: right; color: red;"><strong>${obj.total_costs:,.2f}</strong></td></tr>'

        # Profit
        profit_color = "green" if obj.net_profit >= 0 else "red"
        html += f'<tr style="background-color: #fff3e0;"><td style="padding: 8px;"><strong>NET PROFIT:</strong></td><td style="text-align: right; color: {profit_color}; font-size: 16px;"><strong>${obj.net_profit:,.2f}</strong></td></tr>'

        html += '</table></div>'
        return format_html(html)

    financial_summary.short_description = _("Financial Summary")

    # Admin Actions

    @admin.action(description=_("Submit selected reports"))
    def submit_reports(self, request, queryset):
        """Submit selected reports for approval."""
        success_count = 0
        for report in queryset:
            try:
                SubmitDailyReportService.execute(
                    report=report,
                    submitted_by=request.user,
                )
                success_count += 1
            except (PermissionDenied, ValidationError) as e:
                self.message_user(
                    request,
                    f"Failed to submit report {report.report_date}: {str(e)}",
                    level=messages.ERROR,
                )

        if success_count:
            self.message_user(
                request,
                f"Successfully submitted {success_count} report(s)",
                level=messages.SUCCESS,
            )

    @admin.action(description=_("Approve selected reports"))
    def approve_reports(self, request, queryset):
        """Approve selected reports."""
        success_count = 0
        for report in queryset:
            try:
                ApproveDailyReportService.execute(
                    report=report,
                    approved_by=request.user,
                )
                success_count += 1
            except (PermissionDenied, ValidationError) as e:
                self.message_user(
                    request,
                    f"Failed to approve report {report.report_date}: {str(e)}",
                    level=messages.ERROR,
                )

        if success_count:
            self.message_user(
                request,
                f"Successfully approved {success_count} report(s)",
                level=messages.SUCCESS,
            )

    @admin.action(description=_("Dispute selected reports"))
    def dispute_reports(self, request, queryset):
        """Dispute selected reports."""
        success_count = 0
        for report in queryset:
            try:
                DisputeDailyReportService.execute(
                    report=report,
                    disputed_by=request.user,
                    dispute_reason="Disputed from admin - please review",
                )
                success_count += 1
            except (PermissionDenied, ValidationError) as e:
                self.message_user(
                    request,
                    f"Failed to dispute report {report.report_date}: {str(e)}",
                    level=messages.ERROR,
                )

        if success_count:
            self.message_user(
                request,
                f"Successfully disputed {success_count} report(s)",
                level=messages.SUCCESS,
            )

    @admin.action(description=_("Close selected reports"))
    def close_reports(self, request, queryset):
        """Close/finalize selected reports."""
        success_count = 0
        for report in queryset:
            try:
                CloseDailyReportService.execute(
                    report=report,
                    closed_by=request.user,
                )
                success_count += 1
            except (PermissionDenied, ValidationError) as e:
                self.message_user(
                    request,
                    f"Failed to close report {report.report_date}: {str(e)}",
                    level=messages.ERROR,
                )

        if success_count:
            self.message_user(
                request,
                f"Successfully closed {success_count} report(s)",
                level=messages.SUCCESS,
            )

    def get_queryset(self, request):
        """Optimize queryset with related data."""
        qs = super().get_queryset(request)
        return qs.select_related(
            "created_by",
            "approved_by",
        ).prefetch_related("payment_methods", "cash_denominations")

    def has_delete_permission(self, request, obj=None):
        """Prevent deleting reports through admin."""
        return False

    def changeform_view(self, request, object_id=None, form_url="", extra_context=None):
        """Customize change form view."""
        extra_context = extra_context or {}

        if object_id:
            obj = self.get_object(request, object_id)
            if obj:
                # Add workflow hints
                if obj.status == DailyReport.ReportStatus.DRAFT:
                    extra_context["workflow_hint"] = "Draft - Fill in actual amounts and submit for approval"
                elif obj.status == DailyReport.ReportStatus.SUBMITTED:
                    extra_context["workflow_hint"] = "Submitted - Waiting for manager approval"
                elif obj.status == DailyReport.ReportStatus.APPROVED:
                    extra_context["workflow_hint"] = "Approved - Ready to close"
                elif obj.status == DailyReport.ReportStatus.DISPUTED:
                    extra_context["workflow_hint"] = "Disputed - Resolve issues and resubmit"
                elif obj.status == DailyReport.ReportStatus.CLOSED:
                    extra_context["workflow_hint"] = "Closed - Report is finalized and immutable"

        return super().changeform_view(request, object_id, form_url, extra_context)
