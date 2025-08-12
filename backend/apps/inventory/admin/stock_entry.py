from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from ..models import StockEntry
from jalali_date.widgets import AdminJalaliDateWidget
from jalali_date.admin import ModelAdminJalaliMixin
from django import forms
from ...utils.number_separator import format_number


class StockEntryAdminForm(forms.ModelForm):
    class Meta:
        model = StockEntry
        fields = "__all__"
        widgets = {
            "created_at": AdminJalaliDateWidget,
        }


@admin.register(StockEntry)
class StockEntryAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    """
    Admin interface for StockEntry model.
    - Shows key movement and cost details.
    - Supports filtering by product, movement type, depletion status, and date.
    - Read-only for system-generated fields to prevent accidental edits.
    """

    form = StockEntryAdminForm
    list_display = (
        "id",
        "product",
        "movement_type",
        "formatted_quantity",
        "formatted_remaining_quantity",
        "formatted_unit_cost",
        "is_depleted",
        "created_at",
        "source_document",
    )

    # formatted columns must return str
    def formatted_quantity(self, obj):
        return format_number(obj.quantity)

    formatted_quantity.short_description = _("Quantity")

    def formatted_remaining_quantity(self, obj):
        return format_number(obj.remaining_quantity)

    formatted_remaining_quantity.short_description = _("Remaining Quantity")
    formatted_remaining_quantity.admin_order_field = "remaining_quantity"

    def formatted_unit_cost(self, obj):
        return format_number(obj.unit_cost)

    formatted_unit_cost.short_description = _("Unit Cost")
    formatted_unit_cost.admin_order_field = "unit_cost"

    # source_document as you already had
    def source_document(self, obj):
        if obj.source_object:
            return f"{obj.content_type.model_class().__name__} #{obj.object_id}"
        return _("(No source)")

    source_document.short_description = _("Source Document")
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
