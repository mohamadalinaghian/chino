from django.contrib import admin

from ..models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "last_purchased_price")
    list_editable = ("last_purchased_price",)
    list_filter = (
        "type",
        "is_countable",
        "is_stock_traceable",
        "is_expiry_traceable",
        "is_active",
    )
    search_fields = (
        "name",
        "note",
    )
