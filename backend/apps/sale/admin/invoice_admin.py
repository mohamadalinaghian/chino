from decimal import Decimal

from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from ..models import SaleInvoice, SalePayment
from ..services.invoice.create_invoice_service import CreateInvoiceService
from ..services.invoice.issue_payment_service import IssuePaymentService
from .forms import SaleInvoiceAdminForm, SalePaymentAdminForm


class SalePaymentInline(admin.TabularInline):
    """Inline for invoice payments."""

    model = SalePayment
    extra = 0
    fields = (
        "method",
        "amount_applied",
        "tip_amount",
        "amount_total",
        "status",
        "received_by",
        "received_at",
    )
    readonly_fields = ("amount_total", "received_at")
    autocomplete_fields = ["received_by"]

    def has_add_permission(self, request, obj=None):
        """Prevent adding payments through inline - use service."""
        return False


@admin.register(SaleInvoice)
class SaleInvoiceAdmin(admin.ModelAdmin):
    """Admin for SaleInvoice model - invoice and payment tracking."""

    form = SaleInvoiceAdminForm

    list_display = (
        "invoice_number",
        "status_badge",
        "sale_link",
        "total_amount",
        "total_paid_display",
        "balance_due_display",
        "issued_by",
        "issued_at",
    )

    list_filter = (
        "status",
        "issued_at",
    )

    search_fields = (
        "invoice_number",
        "sale__id",
        "issued_by__username",
    )

    readonly_fields = (
        "sale",
        "invoice_number",
        "subtotal_amount",
        "discount_amount",
        "tax_amount",
        "total_amount",
        "status",
        "issued_by",
        "issued_at",
        "total_paid_display",
        "balance_due_display",
        "is_fully_paid",
        "payment_summary",
    )

    fieldsets = (
        (
            _("Invoice Information"),
            {
                "fields": (
                    "invoice_number",
                    "sale",
                    "status",
                )
            },
        ),
        (
            _("Financial Details"),
            {
                "fields": (
                    "subtotal_amount",
                    "discount_amount",
                    "tax_amount",
                    "total_amount",
                )
            },
        ),
        (
            _("Payment Status"),
            {
                "fields": (
                    "total_paid_display",
                    "balance_due_display",
                    "is_fully_paid",
                    "payment_summary",
                )
            },
        ),
        (
            _("Issuance"),
            {
                "fields": (
                    "issued_by",
                    "issued_at",
                )
            },
        ),
    )

    inlines = [SalePaymentInline]

    date_hierarchy = "issued_at"

    ordering = ("-issued_at",)

    def status_badge(self, obj):
        """Display status with color badge."""
        colors = {
            SaleInvoice.InvoiceStatus.UNPAID: "red",
            SaleInvoice.InvoiceStatus.PARTIALLY_PAID: "orange",
            SaleInvoice.InvoiceStatus.PAID: "green",
            SaleInvoice.InvoiceStatus.VOID: "gray",
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            colors.get(obj.status, "gray"),
            obj.get_status_display(),
        )

    status_badge.short_description = _("Status")

    def sale_link(self, obj):
        """Display link to related sale."""
        if obj.sale:
            url = f"/admin/sale/sale/{obj.sale.pk}/change/"
            return format_html('<a href="{}">Sale #{}</a>', url, obj.sale.pk)
        return "-"

    sale_link.short_description = _("Sale")

    def total_paid_display(self, obj):
        """Display total paid amount."""
        if obj.pk:
            return format_html(
                '<strong style="color: green;">{}</strong>',
                obj.total_paid
            )
        return "-"

    total_paid_display.short_description = _("Total Paid")

    def balance_due_display(self, obj):
        """Display balance due."""
        if obj.pk:
            balance = obj.balance_due
            color = "red" if balance > 0 else "green"
            return format_html(
                '<strong style="color: {};">{}</strong>',
                color,
                balance
            )
        return "-"

    balance_due_display.short_description = _("Balance Due")

    def payment_summary(self, obj):
        """Display summary of all payments."""
        if not obj.pk:
            return "-"

        payments = obj.payments.all()
        if not payments:
            return _("No payments")

        html = '<table style="width: 100%;">'
        html += "<tr><th>Method</th><th>Applied</th><th>Tip</th><th>Total</th><th>Status</th></tr>"
        for payment in payments:
            html += f"<tr><td>{payment.get_method_display()}</td>"
            html += f"<td>{payment.amount_applied}</td>"
            html += f"<td>{payment.tip_amount}</td>"
            html += f"<td><strong>{payment.amount_total}</strong></td>"
            html += f"<td>{payment.get_status_display()}</td></tr>"
        html += "</table>"
        return format_html(html)

    payment_summary.short_description = _("Payments")

    def get_queryset(self, request):
        """Optimize queryset with related data."""
        qs = super().get_queryset(request)
        return qs.select_related(
            "sale",
            "issued_by",
        ).prefetch_related("payments")

    def save_model(self, request, obj, form, change):
        """Use CreateInvoiceService for new invoices."""
        if not change:  # Creating new invoice
            tax_amount = form.cleaned_data.get("tax_amount", Decimal("0"))
            try:
                invoice = CreateInvoiceService.execute(
                    sale=obj.sale,
                    issued_by=request.user,
                    tax_amount=tax_amount,
                )
                form.instance = invoice
                messages.success(request, _("Invoice created successfully"))
            except (ValidationError, PermissionDenied) as e:
                messages.error(request, str(e))
                raise
        else:
            # Invoices are immutable after creation
            messages.error(request, _("Invoices cannot be modified after creation"))

    def has_add_permission(self, request):
        """Allow creating invoices through admin."""
        return request.user.has_perm("sale.add_saleinvoice")

    def has_delete_permission(self, request, obj=None):
        """Prevent deleting invoices."""
        return False
