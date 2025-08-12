from django import forms
from django.contrib import admin
from ..models import PurchaseInvoice
from .purchase_item import PurchaseItemInline
from .signals import purchase_item_post_save_admin  # it will active signal
from django.db.models import Sum
from jalali_date.widgets import AdminJalaliDateWidget
from jalali_date.admin import ModelAdminJalaliMixin
from ...utils.number_separator import format_number
from django.utils.translation import gettext_lazy as _


class PurchaseInvoiceAdminForm(forms.ModelForm):
    class Meta:
        model = PurchaseInvoice
        fields = "__all__"
        widget = {
            "issue_date": AdminJalaliDateWidget,
        }


@admin.register(PurchaseInvoice)
class PurchaseInvoiceAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    """
    Admin for managing PurchaseInvoices.
    - Shows supplier, date, status, and final cost.
    - Allows inline editing of purchase items.
    """

    form = PurchaseInvoiceAdminForm
    list_display = (
        "id",
        "issue_date",
        "supplier",
        "status",
        "formatted_invoice_final_cost",
    )

    def formatted_invoice_final_cost(self, obj):
        return format_number(obj.invoice_final_cost)

    formatted_invoice_final_cost.short_description = _("Invoice Final Cost")
    list_filter = ("status", "issue_date", "supplier")
    search_fields = ("supplier__name", "note")
    date_hierarchy = "issue_date"
    inlines = [PurchaseItemInline]
    autocomplete_fields = ("supplier", "created_by")
