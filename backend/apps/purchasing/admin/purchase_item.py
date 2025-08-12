from django import forms
from django.contrib import admin
from ..models import PurchaseItem
from jalali_date.widgets import AdminJalaliDateWidget
from jalali_date.admin import ModelAdminJalaliMixin, TabularInlineJalaliMixin
from ...utils.number_separator import format_number
from django.utils.translation import gettext_lazy as _


class PurchaseItemAdminForm(forms.ModelForm):
    class Meta:
        model = PurchaseItem
        fields = "__all__"
        widgets = {
            "expiry_date": AdminJalaliDateWidget,
        }


class PurchaseItemInline(TabularInlineJalaliMixin, admin.TabularInline):
    """
    Inline for adding/editing purchase items inside a PurchaseInvoice admin page.
    - Allows quick item addition without leaving invoice page.
    """

    form = PurchaseItemAdminForm

    model = PurchaseItem
    extra = 1
    autocomplete_fields = ("product",)
    fields = ("product", "quantity", "unit_price", "expiry_date", "note")
    readonly_fields = ()


@admin.register(PurchaseItem)
class PurchaseItemAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    """
    Standalone admin for PurchaseItem.
    """

    form = PurchaseItemAdminForm
    list_display = (
        "product",
        "purchase_invoice",
        "formatted_quantity",
        "formatted_unit_price",
        "expiry_date",
    )

    def formatted_quantity(self, obj):
        return format_number(obj.quantity)

    formatted_quantity.short_description = _("Quantity")  # type: ignore

    def formatted_unit_price(self, obj):
        return format_number(obj.unit_price)

    formatted_unit_price.short_description = _("Unit Price") # pyright: ignore[reportFunctionMemberAccess]

    search_fields = ("product__name", "purchase_invoice__id")
    list_filter = ("expiry_date",)
    autocomplete_fields = ("product", "purchase_invoice")
