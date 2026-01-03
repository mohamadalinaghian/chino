from django.contrib import admin

from ..models import Sale


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    pass
