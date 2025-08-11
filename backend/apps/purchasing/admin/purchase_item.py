from django.contrib import admin
from ..models import PurchaseItem


class PurchaseItemInline(admin.TabularInline):
    """
    Inline for adding/editing purchase items inside a PurchaseInvoice admin page.
    - Allows quick item addition without leaving invoice page.
    """

    model = PurchaseItem
    extra = 1
    autocomplete_fields = ("product",)
    fields = ("product", "quantity", "unit_price", "expiry_date", "note")
    readonly_fields = ()


@admin.register(PurchaseItem)
class PurchaseItemAdmin(admin.ModelAdmin):
    """
    Standalone admin for PurchaseItem.
    """

    list_display = (
        "product",
        "purchase_invoice",
        "quantity",
        "unit_price",
        "expiry_date",
    )
    search_fields = ("product__name", "purchase_invoice__id")
    list_filter = ("expiry_date",)
    autocomplete_fields = ("product", "purchase_invoice")
