from django.contrib import admin

from ..models import SupplierProduct


# Inline for Supplier:
class SupplierProductInline(admin.TabularInline):
    model = SupplierProduct
    extra = 0
    autocomplete_fields = ("product",)
    raw_id_fields = ("product",)
    fields = ("product", "brand")


@admin.register(SupplierProduct)
class SupplierProductAdmin(admin.ModelAdmin):
    list_filter = (
        "supplier",
        "product",
    )
    search_fields = (
        "supplier",
        "product",
    )
    fields = (
        "supplier",
        "product",
        "brand",
    )
    autocomplete_fields = ("supplier", "product")
