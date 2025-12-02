"""
Django Admin configuration for DailyFinancialReport.

Features:
- Generate daily reports
- View financial summaries
- Finalize reports
- Export reports
- Discrepancy management
"""

from django.contrib import admin, messages
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from jalali_date.admin import ModelAdminJalaliMixin

from ..models import DailyFinancialReport
from ..services.financial_report import FinancialReportService


@admin.register(DailyFinancialReport)
class DailyFinancialReportAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    """
    Admin interface for daily financial reports.

    Features:
    - View daily financial summaries
    - Generate end-of-day reports
    - Finalize reports
    - Track discrepancies
    - View profit margins
    """

    # Display configuration
    list_display = (
        "report_id",
        "jalali_date",
        "revenue_display",
        "cogs_display",
        "profit_display",
        "margin_display",
        "finalized_badge",
        "generated_by_display",
    )

    list_filter = (
        "is_finalized",
        ("report_date", admin.DateFieldListFilter),
        ("generated_by", admin.RelatedOnlyFieldListFilter),
    )

    search_fields = (
        "id",
        "notes",
        "generated_by__name",
    )

    readonly_fields = (
        "jalali_report_date",
        "total_revenue",
        "pos_total",
        "cash_total",
        "card_transfer_total",
        "purchase_expenses",
        "operational_expenses",
        "total_cogs",
        "gross_profit",
        "net_profit",
        "profit_margin_calc",
        "generated_at",
    )

    fieldsets = (
        (
            _("Report Information"),
            {
                "fields": (
                    "jalali_report_date",
                    "generated_by",
                    "is_finalized",
                )
            },
        ),
        (
            _("Revenue Breakdown"),
            {
                "fields": (
                    "total_revenue",
                    ("pos_total", "cash_total", "card_transfer_total"),
                )
            },
        ),
        (
            _("Expenses"),
            {
                "fields": (
                    "purchase_expenses",
                    "operational_expenses",
                    "total_cogs",
                )
            },
        ),
        (
            _("Profit"),
            {
                "fields": (
                    "gross_profit",
                    "net_profit",
                    "profit_margin_calc",
                )
            },
        ),
        (
            _("Discrepancies"),
            {
                "fields": (
                    ("pos_discrepancy", "cash_discrepancy", "card_to_card_discrepancy"),
                ),
                "classes": ("collapse",),
            },
        ),
        (
            _("Notes"),
            {
                "fields": ("notes",),
            },
        ),
        (
            _("System Information"),
            {
                "fields": ("generated_at",),
                "classes": ("collapse",),
            },
        ),
    )

    actions = [
        "action_finalize_reports",
        "action_export_reports",
        "action_show_profit_margin",
    ]

    # ============ DISPLAY METHODS ============ #

    def report_id(self, obj):
        """Display report ID."""
        return f"گزارش #{obj.pk}"

    report_id.short_description = _("Report")
    report_id.admin_order_field = "id"

    def jalali_date(self, obj):
        """Display Jalali date."""
        return obj.jalali_report_date

    jalali_date.short_description = _("Date")
    jalali_date.admin_order_field = "report_date"

    def revenue_display(self, obj):
        """Display total revenue with formatting."""
        return format_html(
            '<strong style="color: #007bff;">{:,.0f} ت</strong>', obj.total_revenue
        )

    revenue_display.short_description = _("Revenue")
    revenue_display.admin_order_field = "total_revenue"

    def cogs_display(self, obj):
        """Display COGS with formatting."""
        return format_html(
            '<span style="color: #dc3545;">{:,.0f} ت</span>', obj.total_cogs
        )

    cogs_display.short_description = _("COGS")
    cogs_display.admin_order_field = "total_cogs"

    def profit_display(self, obj):
        """Display net profit with formatting."""
        color = "#28a745" if obj.net_profit >= 0 else "#dc3545"
        return format_html(
            '<strong style="color: {};">{:,.0f} ت</strong>', color, obj.net_profit
        )

    profit_display.short_description = _("Net Profit")
    profit_display.admin_order_field = "net_profit"

    def margin_display(self, obj):
        """Display profit margin percentage."""
        if obj.total_revenue > 0:
            margin = (obj.net_profit / obj.total_revenue) * 100
            color = (
                "#28a745" if margin >= 20 else "#ffc107" if margin >= 10 else "#dc3545"
            )
            return format_html(
                '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
                color,
                margin,
            )
        return "-"

    margin_display.short_description = _("Margin %")

    def finalized_badge(self, obj):
        """Display finalization status."""
        if obj.is_finalized:
            return format_html(
                '<span style="background-color: #28a745; color: white; '
                'padding: 3px 10px; border-radius: 3px; font-size: 11px;">🔒 نهایی شده</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #ffc107; color: white; '
                'padding: 3px 10px; border-radius: 3px; font-size: 11px;">🔓 پیش‌نویس</span>'
            )

    finalized_badge.short_description = _("Status")
    finalized_badge.admin_order_field = "is_finalized"

    def generated_by_display(self, obj):
        """Display who generated the report."""
        if obj.generated_by:
            return obj.generated_by.name
        return "-"

    generated_by_display.short_description = _("Generated By")

    def profit_margin_calc(self, obj):
        """Calculate and display detailed profit margins."""
        if obj.total_revenue == 0:
            return "بدون فروش"

        margins = FinancialReportService.get_profit_margin_analysis(obj)

        return format_html(
            '<div style="line-height: 1.8;">'
            "<strong>حاشیه سود ناخالص:</strong> {:.1f}%<br>"
            "<strong>حاشیه سود خالص:</strong> {:.1f}%<br>"
            "<strong>نرخ سود:</strong> {:.1f}%"
            "</div>",
            margins["gross_margin"],
            margins["net_margin"],
            margins["markup"],
        )

    profit_margin_calc.short_description = _("Profit Margins")

    # ============ CUSTOM ACTIONS ============ #

    @admin.action(description=_("Finalize selected reports"))
    def action_finalize_reports(self, request, queryset):
        """Finalize selected reports (make them immutable)."""
        finalized_count = 0

        for report in queryset:
            if not report.is_finalized:
                try:
                    FinancialReportService.finalize_report(
                        report=report,
                        finalized_by=request.user,
                    )
                    finalized_count += 1
                except Exception as e:
                    messages.error(
                        request,
                        f"خطا در نهایی‌سازی گزارش {
                            report.jalali_report_date}: {str(e)}",
                    )

        if finalized_count > 0:
            messages.success(request, f"{finalized_count} گزارش با موفقیت نهایی شد.")

    @admin.action(description=_("Export to Excel"))
    def action_export_reports(self, request, queryset):
        """Export selected reports to Excel."""
        # TODO: Implement Excel export
        messages.info(
            request,
            f"امکان خروجی اکسل برای {
                queryset.count()} گزارش به زودی اضافه می‌شود.",
        )

    @admin.action(description=_("Show detailed profit analysis"))
    def action_show_profit_margin(self, request, queryset):
        """Show detailed profit margin analysis."""
        if queryset.count() != 1:
            messages.warning(request, "لطفاً فقط یک گزارش انتخاب کنید.")
            return

        report = queryset.first()
        margins = FinancialReportService.get_profit_margin_analysis(report)

        messages.info(
            request,
            format_html(
                "<strong>تحلیل سودآوری گزارش {}</strong><br><br>"
                "حاشیه سود ناخالص: <strong>{:.1f}%</strong><br>"
                "حاشیه سود خالص: <strong>{:.1f}%</strong><br>"
                "نرخ سود: <strong>{:.1f}%</strong>",
                report.jalali_report_date,
                margins["gross_margin"],
                margins["net_margin"],
                margins["markup"],
            ),
        )

    # ============ QUERYSETS ============ #

    def get_queryset(self, request):
        """Optimize queries."""
        qs = super().get_queryset(request)
        return qs.select_related("generated_by")

    # ============ PERMISSIONS ============ #

    def has_add_permission(self, request):
        """Reports should be generated through service."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Cannot delete finalized reports."""
        if obj and obj.is_finalized:
            return False
        return super().has_delete_permission(request, obj)

    def has_change_permission(self, request, obj=None):
        """Cannot change finalized reports."""
        if obj and obj.is_finalized:
            return False
        return super().has_change_permission(request, obj)

    # ============ CUSTOM VIEWS ============ #

    def changelist_view(self, request, extra_context=None):
        """Add summary statistics to changelist."""
        extra_context = extra_context or {}

        # Get summary for current month

        from django.utils import timezone

        today = timezone.now().date()
        month_start = today.replace(day=1)

        month_reports = DailyFinancialReport.objects.filter(
            report_date__gte=month_start,
            report_date__lte=today,
            is_finalized=True,
        )

        if month_reports.exists():
            from django.db.models import Avg, Sum

            summary = month_reports.aggregate(
                total_revenue=Sum("total_revenue"),
                total_profit=Sum("net_profit"),
                avg_revenue=Avg("total_revenue"),
            )

            extra_context["summary"] = summary
            extra_context["month_name"] = today.strftime("%Y-%m")

        return super().changelist_view(request, extra_context)
