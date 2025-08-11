from django.contrib import admin
from ..models import PurchaseInvoice
from .purchase_item import PurchaseItemInline


@admin.register(PurchaseInvoice)
class PurchaseInvoiceAdmin(admin.ModelAdmin):
    """
    Admin for managing PurchaseInvoices.
    - Shows supplier, date, status, and final cost.
    - Allows inline editing of purchase items.
    """

    list_display = ("id", "issue_date", "supplier", "status", "invoice_final_cost")
    list_filter = ("status", "issue_date", "supplier")
    search_fields = ("supplier__name", "note")
    date_hierarchy = "issue_date"
    inlines = [PurchaseItemInline]
    autocomplete_fields = ("supplier", "created_by")
