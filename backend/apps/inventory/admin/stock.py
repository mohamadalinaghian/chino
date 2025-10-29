from django.contrib import admin
from jalali_date.admin import ModelAdminJalaliMixin

from ..forms import StockForm
from ..models import Stock


@admin.register(Stock)
class StockAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    form = StockForm

    list_display = (
        "stored_product",
        "initial_quantity",
        "remaining_quantity",
        "unit_price",
        "create_at",
    )
    ordering = ("create_at",)
    list_select_related = ("stored_product",)
    search_fields = ("stored_product__name",)
