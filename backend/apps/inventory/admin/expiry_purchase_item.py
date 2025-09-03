from django.contrib import admin
from jalali_date.admin import ModelAdminJalaliMixin

from ..forms import ExpiryPurchaseItemForm
from ..models import ExpiryPurchaseItem


@admin.register(ExpiryPurchaseItem)
class ExpiryPurchaseItemAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    form = ExpiryPurchaseItemForm

    fields = ("purchased_item", "expiry_date")
    readonly_fields = ("purchased_item",)

    def has_add_permission(self, request, obj=None) -> bool:
        return False
