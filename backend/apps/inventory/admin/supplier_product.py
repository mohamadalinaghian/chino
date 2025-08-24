from django.contrib import admin

from ..models import SupplierProduct


# Inline for Supplier:
class SupplierProductInline(admin.TabularInline):
    model = SupplierProduct
    extra = 0
    autocomplete_fields = ("product",)
    raw_id_fields = ("product",)
    fields = ("product", "brand")
