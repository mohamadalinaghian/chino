from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from ..models import StockEntry


@admin.register(StockEntry)
class StockEntryAdmin(admin.ModelAdmin):
    """
    Admin interface for StockEntry model.
    - Shows key movement and cost details.
    - Supports filtering by product, movement type, depletion status, and date.
    - Read-only for system-generated fields to prevent accidental edits.
    """

    list_display = (
        "id",
        "product",
        "movement_type",
        "quantity",
        "remaining_quantity",
        "unit_cost",
        "is_depleted",
        "created_at",
        "source_document",
    )
    list_filter = (
        "movement_type",
        "is_depleted",
        ("product", admin.RelatedOnlyFieldListFilter),
        ("created_at", admin.DateFieldListFilter),
    )
    search_fields = ("product__name",)
    date_hierarchy = "created_at"
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at", "source_document")

    autocomplete_fields = ("product",)

    def source_document(self, obj):
        """
        Shows a human-readable link to the source object if exists.
        Example: 'PurchaseItem #12'
        """
        if obj.source_object:
            return f"{obj.content_type.model_class().__name__} #{obj.object_id}"
        return _("(No source)")

    source_document.short_description = _("Source Document")
