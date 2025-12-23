from django.contrib import admin

from ..models import Sale


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    # list_display = ("state", "total_amount")
    # ordering = ("state", "-opened_at")
    pass
