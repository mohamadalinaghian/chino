from django.contrib import admin
from apps.inventory.models import Product
from .recipe import RecipeInline


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """
    Admin configuration for Product model.
    - Provides search, filter, and ordering by key fields.
    - Shows important columns like product type and inventory tracking.
    """

    list_display = (
        "name",
        "product_type",
        "is_countable",
        "track_inventory",
        "is_active",
    )
    list_filter = ("product_type", "is_countable", "track_inventory", "is_active")
    search_fields = ("name", "description")
    ordering = ("name",)
    list_per_page = 25
    inlines = (RecipeInline,)
