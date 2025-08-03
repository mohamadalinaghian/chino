from django.contrib import admin
from apps.inventory.models import Unit


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("name", "base_unit", "conversion_ratio")
    fields = (("name", "conversion_ratio"), "base_unit")
    list_filter = ("name", "base_unit")
