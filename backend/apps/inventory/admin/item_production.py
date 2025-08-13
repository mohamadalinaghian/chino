from django import forms
from django.contrib import admin
from ..models import ItemProduction
from django.contrib.auth import get_user_model
from jalali_date.admin import AdminJalaliDateWidget
from jalali_date.admin import ModelAdminJalaliMixin
from ..services import item_production_service


class ItemProductionForm(forms.ModelForm):
    class Meta:
        model = ItemProduction
        fields = "__all__"
        widgets = {
            "create_at": AdminJalaliDateWidget,
        }


@admin.register(ItemProduction)
class ItemProductionAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    list_display = (
        "product",
        "recipe",
        "input_quantity",
        "output_quantity",
        "total_cost",
        "created_at",
    )
    readonly_fields = ("created_at", "updated_at")
    list_filter = ("product", "recipe", "creators")
    search_fields = ("product__name", "recipe__name", "creators__name")
    autocomplete_fields = (
        "product",
        "recipe",
        "creators",
    )

    fields = (
        "product",
        "recipe",
        "input_quantity",
        "output_quantity",
        "creators",
        "notes",
        "created_at",
        "updated_at",
    )

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        item_production_service.process_production(form.instance)
