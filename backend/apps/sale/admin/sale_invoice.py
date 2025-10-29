from django.contrib import admin

from ..models import SaleInvoice
from .sale_item import SaleItemPOSInline


@admin.register(SaleInvoice)
class SaleInvoiceAdmin(admin.ModelAdmin):
    list_display = ("jalali_issue_date", "staff", "bill_status", "total_revenue")
    readonly_fields = ("jalali_issue_date", "total_revenue", "total_paid")
    inlines = [SaleItemPOSInline]  # <-- our custom inline
    change_form_template = "admin/sale/pos_change_form.html"

    def get_urls(self):
        urls = super().get_urls()
        from django.urls import path

        extra = [
            path(
                "pos/",
                self.admin_site.admin_view(self.pos_view),
                name="sale_invoice_pos",
            ),
        ]
        return extra + urls

    # def pos_view(self, request):
    #     """Redirect staff to their OPEN invoice (or create one)."""
    #     invoice = get_or_create_open_invoice(request.user)
    #     url = reverse("admin:sale_saleinvoice_change", args=(invoice.pk,))
    #     return redirect(url)
