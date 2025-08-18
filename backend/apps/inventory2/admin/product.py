from django.contrib import admin
from apps.inventory2.models import Product
from .recipe import RecipeInline
import nested_admin


@admin.register(Product)
class ProductAdmin(nested_admin.NestedModelAdmin):
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
    inlines = [RecipeInline]

    def get_inline_instances(self, request, obj=None):
        """
        Only display the RecipeInline if the product_type is not RAW or CONSUMABLE.
        """
        inline_instances = []
        for inline_class in self.inlines:
            if inline_class is RecipeInline:
                if obj and obj.product_type in (
                    obj.ProductType.RAW,
                    obj.ProductType.CONSUMABLE,
                ):
                    continue  # skip showing this inline
            inline = inline_class(self.model, self.admin_site)
            inline_instances.append(inline)
        return inline_instances
