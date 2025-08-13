from django import forms
from django.contrib import admin
from ..models import ItemProduction
from django.contrib.auth import get_user_model
from jalali_date.admin import AdminJalaliDateWidget
from jalali_date.admin import ModelAdminJalaliMixin


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

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == "creators":
            kwargs["queryset"] = get_user_model().objects.filter(is_staff=True)
        return super().formfield_for_manytomany(db_field, request, **kwargs)
