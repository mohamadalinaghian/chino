from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from persiantools.jdatetime import JalaliDate

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
    list_display = (
        "supplier",
        "product",
        "brand",
        "last_purchase_price",
        "jalali_date",
    )
    list_select_related = ("supplier", "product")
    list_editable = ("brand",)
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

    @admin.display(description=_("Last price date"))
    def jalali_date(self, obj):

        return JalaliDate(obj.last_price_date).strftime("%c", locale="fa")
