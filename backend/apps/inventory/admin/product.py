from django.contrib import admin

from ..models import Product
from ..services import ProductService


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "type",
    )
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

    def save_model(self, request, obj, form, change):
        """
        Override default save to ensure atomic get_or_create via service.
        """
        if change:
            super().save_model(request, obj, form, change)
        else:
            ProductService.get_or_create_product(**form.cleaned_data)
