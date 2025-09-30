from django.contrib import admin

from ..models import Visitor


@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    list_display = ("name", "phone_number", "related_supplier")
    search_fields = ("name", "related_supplier")
    list_filter = ("related_supplier",)
    autocomplete_fields = ("related_supplier",)


class VisitorInline(admin.TabularInline):
    fields = ("name", "phone_number", "notes")
    model = Visitor
    extra = 0
