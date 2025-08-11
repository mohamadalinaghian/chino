from django.contrib import admin
from ..models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    """
    Admin configuration for Supplier.
    - Lets you manage supplier's related products and visitors.
    """

    list_display = ("name", "is_active", "address")
    list_filter = ("is_active",)
    search_fields = ("name", "note", "address")
    filter_horizontal = ("related_products", "company_visitor")
