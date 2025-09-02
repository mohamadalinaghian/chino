from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from jalali_date.admin import StackedInlineJalaliMixin

from ..forms.purchase_item import PurchaseItemInlineForm
from ..models.purchase_item import PurchaseItem


class PurchaseItemInline(StackedInlineJalaliMixin, admin.StackedInline):
    """
    For use in Purchase Invoice admin.
    """

    model = PurchaseItem
    form = PurchaseItemInlineForm
    extra = 0
    fieldsets = (
        (
            _("Product Info"),
            {
                "fields": (("purchased_product", "brand", "expiry_date"),),
            },
        ),
        (
            _("Quantity & Packaging"),
            {
                "fields": ("quantity", ("package_quantity", "package_count")),
            },
        ),
        (
            _("Pricing"),
            {
                "fields": (("purchased_unit_price", "total_cost"),),
            },
        ),
    )

    autocomplete_fields = ("purchased_product",)
