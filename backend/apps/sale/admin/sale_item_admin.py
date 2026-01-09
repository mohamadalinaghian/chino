from django.contrib import admin

from ..models import SaleItem


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    pass
