from django.contrib import admin

from ..models.supplier import Supplier
from .supplier_product import SupplierProductInline


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = (
        "company_name",
        "info",
    )
    list_editable = ("info",)
    search_fields = ("company_name",)
    list_filter = (("products", admin.RelatedOnlyFieldListFilter),)
    inlines = (SupplierProductInline,)
