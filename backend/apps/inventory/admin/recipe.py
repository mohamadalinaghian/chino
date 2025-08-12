from django import forms
from django.contrib import admin
from ..models import Recipe
from jalali_date.widgets import AdminJalaliDateWidget
from jalali_date.admin import ModelAdminJalaliMixin


class RecipeAdminForm(forms.ModelForm):
    class Meta:
        model = Recipe
        fields = "__all__"
        widgets = {
            "created_at": AdminJalaliDateWidget,
            "updated_at": AdminJalaliDateWidget,
        }


@admin.register(Recipe)
class RecipeAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    form = RecipeAdminForm
    list_display = (
        "product",
        "instruction",
        "prepared_time",
    )
    list_filter = ("product",)
    search_fields = ("product", "created_at")
    readonly_fields = ("created_at", "updated_at")


class RecipeInline(admin.TabularInline):
    """This class used for product form."""

    model = Recipe
    extra = 1
    fields = ("instruction", "prepared_time")
    readonly_fields = ()
