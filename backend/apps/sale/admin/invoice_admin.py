from django.contrib import admin

from ..models import SaleInvoice


@admin.register(SaleInvoice)
class SaleInvoiceAdmin(admin.ModelAdmin):
    pass
