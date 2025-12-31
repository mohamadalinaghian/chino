from decimal import Decimal

from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from ..models import SalePayment, SaleRefund
from ..services.invoice.create_refund_service import CreateRefundService
from ..services.invoice.issue_payment_service import IssuePaymentService
from .forms import SalePaymentAdminForm


class SaleRefundInline(admin.TabularInline):
    """Inline for payment refunds."""

    model = SaleRefund
    extra = 0
    fields = (
        "amount",
        "method",
        "status",
        "reason",
        "processed_by",
        "processed_at",
    )
    readonly_fields = ("processed_at",)
    autocomplete_fields = ["processed_by"]

    def has_add_permission(self, request, obj=None):
        """Prevent adding refunds through inline - use service."""
        return False


@admin.register(SalePayment)
class SalePaymentAdmin(admin.ModelAdmin):
    """Admin for SalePayment model - payment tracking."""

    form = SalePaymentAdminForm

    list_display = (
        "id",
        "invoice_link",
        "method",
        "amount_applied",
        "tip_amount",
        "amount_total",
        "status_badge",
        "refundable_amount_display",
        "received_by",
        "received_at",
    )

    list_filter = (
        "method",
        "status",
        "received_at",
    )

    search_fields = (
        "invoice__invoice_number",
        "received_by__username",
        "destination_account",
    )

    readonly_fields = (
        "invoice",
        "method",
        "amount_total",
        "amount_applied",
        "tip_amount",
        "status",
        "received_by",
        "received_at",
        "total_refunded",
        "refundable_amount",
        "refund_summary",
    )

    fieldsets = (
        (
            _("Payment Information"),
            {
                "fields": (
                    "invoice",
                    "method",
                    "status",
                )
            },
        ),
        (
            _("Amounts"),
            {
                "fields": (
                    "amount_applied",
                    "tip_amount",
                    "amount_total",
                )
            },
        ),
        (
            _("Refund Information"),
            {
                "fields": (
                    "total_refunded",
                    "refundable_amount",
                    "refund_summary",
                )
            },
        ),
        (
            _("Processing"),
            {
                "fields": (
                    "received_by",
                    "received_at",
                    "destination_account",
                )
            },
        ),
    )

    inlines = [SaleRefundInline]

    date_hierarchy = "received_at"

    ordering = ("-received_at",)

    def status_badge(self, obj):
        """Display status with color badge."""
        colors = {
            SalePayment.PaymentStatus.COMPLETED: "green",
            SalePayment.PaymentStatus.VOID: "red",
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            colors.get(obj.status, "gray"),
            obj.get_status_display(),
        )

    status_badge.short_description = _("Status")

    def invoice_link(self, obj):
        """Display link to related invoice."""
        if obj.invoice:
            url = f"/admin/sale/saleinvoice/{obj.invoice.pk}/change/"
            return format_html(
                '<a href="{}">{}</a>',
                url,
                obj.invoice.invoice_number
            )
        return "-"

    invoice_link.short_description = _("Invoice")

    def refundable_amount_display(self, obj):
        """Display refundable amount."""
        if obj.pk:
            amount = obj.refundable_amount
            color = "green" if amount > 0 else "gray"
            return format_html(
                '<strong style="color: {};">{}</strong>',
                color,
                amount
            )
        return "-"

    refundable_amount_display.short_description = _("Refundable")

    def refund_summary(self, obj):
        """Display summary of all refunds."""
        if not obj.pk:
            return "-"

        refunds = obj.refunds.all()
        if not refunds:
            return _("No refunds")

        html = '<table style="width: 100%;">'
        html += "<tr><th>Amount</th><th>Method</th><th>Status</th><th>Reason</th></tr>"
        for refund in refunds:
            html += f"<tr><td><strong>{refund.amount}</strong></td>"
            html += f"<td>{refund.get_method_display()}</td>"
            html += f"<td>{refund.get_status_display()}</td>"
            html += f"<td>{refund.reason}</td></tr>"
        html += "</table>"
        return format_html(html)

    refund_summary.short_description = _("Refunds")

    def get_queryset(self, request):
        """Optimize queryset with related data."""
        qs = super().get_queryset(request)
        return qs.select_related(
            "invoice",
            "received_by",
        ).prefetch_related("refunds")

    def save_model(self, request, obj, form, change):
        """Use IssuePaymentService for new payments."""
        if not change:  # Creating new payment
            try:
                payment = IssuePaymentService.execute(
                    invoice=obj.invoice,
                    received_by=request.user,
                    method=obj.method,
                    amount_applied=obj.amount_applied,
                    tip_amount=obj.tip_amount or Decimal("0"),
                    destination_account=obj.destination_account,
                )
                form.instance = payment
                messages.success(request, _("Payment recorded successfully"))
            except (ValidationError, PermissionDenied) as e:
                messages.error(request, str(e))
                raise
        else:
            # Payments are immutable after creation
            messages.error(request, _("Payments cannot be modified after creation"))

    def has_add_permission(self, request):
        """Allow recording payments through admin."""
        return request.user.has_perm("sale.add_salepayment")

    def has_delete_permission(self, request, obj=None):
        """Prevent deleting payments."""
        return False


@admin.register(SaleRefund)
class SaleRefundAdmin(admin.ModelAdmin):
    """Admin for SaleRefund model - refund tracking."""

    list_display = (
        "id",
        "payment_link",
        "invoice_link",
        "amount",
        "method",
        "status_badge",
        "processed_by",
        "processed_at",
    )

    list_filter = (
        "method",
        "status",
        "processed_at",
    )

    search_fields = (
        "invoice__invoice_number",
        "payment__id",
        "processed_by__username",
        "reason",
    )

    readonly_fields = (
        "payment",
        "invoice",
        "amount",
        "method",
        "status",
        "reason",
        "processed_by",
        "processed_at",
    )

    fieldsets = (
        (
            _("Refund Information"),
            {
                "fields": (
                    "payment",
                    "invoice",
                    "amount",
                    "method",
                    "status",
                )
            },
        ),
        (
            _("Reason"),
            {
                "fields": ("reason",)
            },
        ),
        (
            _("Processing"),
            {
                "fields": (
                    "processed_by",
                    "processed_at",
                )
            },
        ),
    )

    date_hierarchy = "processed_at"

    ordering = ("-processed_at",)

    def status_badge(self, obj):
        """Display status with color badge."""
        colors = {
            SaleRefund.Status.COMPLETED: "green",
            SaleRefund.Status.VOID: "red",
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            colors.get(obj.status, "gray"),
            obj.get_status_display(),
        )

    status_badge.short_description = _("Status")

    def payment_link(self, obj):
        """Display link to related payment."""
        if obj.payment:
            url = f"/admin/sale/salepayment/{obj.payment.pk}/change/"
            return format_html(
                '<a href="{}">Payment #{}</a>',
                url,
                obj.payment.pk
            )
        return "-"

    payment_link.short_description = _("Payment")

    def invoice_link(self, obj):
        """Display link to related invoice."""
        if obj.invoice:
            url = f"/admin/sale/saleinvoice/{obj.invoice.pk}/change/"
            return format_html(
                '<a href="{}">{}</a>',
                url,
                obj.invoice.invoice_number
            )
        return "-"

    invoice_link.short_description = _("Invoice")

    def get_queryset(self, request):
        """Optimize queryset with related data."""
        qs = super().get_queryset(request)
        return qs.select_related(
            "payment",
            "invoice",
            "processed_by",
        )

    def has_add_permission(self, request):
        """Prevent adding refunds through admin - use service."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Prevent deleting refunds through admin."""
        return False
