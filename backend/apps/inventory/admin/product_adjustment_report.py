from django.contrib import admin

from ..models import ProductAdjustmentReport


class ProductAdjustmentReportInline(admin.TabularInline):
    model = ProductAdjustmentReport
    extra = 0
    autocomplete_fields = ("product",)
    fields = ("product", "current_quantity")
