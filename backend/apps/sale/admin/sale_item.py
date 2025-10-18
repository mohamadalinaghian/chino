from django.contrib import admin

from ..models import SaleItem


class SaleItemInline(admin.StackedInline):
    model = SaleItem
    extra = 0
    fields = ("product", "quantity", "sold_unit_price")
