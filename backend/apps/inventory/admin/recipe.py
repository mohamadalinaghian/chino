from django import forms
from django.contrib import admin

from ..services.recipe_component_normalizer import normalize_components
from ..models import Recipe
from jalali_date.widgets import AdminJalaliDateWidget
from jalali_date.admin import ModelAdminJalaliMixin
from .recipe_component import RecipeComponentInline
import nested_admin
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.db import transaction


class RecipeAdminForm(forms.ModelForm):
    class Meta:
        model = Recipe
        fields = "__all__"
        widgets = {
            "created_at": AdminJalaliDateWidget,
            "updated_at": AdminJalaliDateWidget,
        }


class RecipeInlineForm(forms.ModelForm):
    class Meta:
        model = Recipe
        fields = "__all__"
        widgets = {
            "created_at": AdminJalaliDateWidget,
        }

    def clean(self):
        cleaned_data = super().clean()
        product = cleaned_data.get("product")

        if not product and self.instance.product_id:
            product = self.instance.product

        if product and product.product_type not in Recipe.ALLOWED_RECIPE_PRODUCT_TYPES:
            raise ValidationError(
                {"product": _("Recipe cannot be created for raw products.")}
            )

        return cleaned_data


@admin.register(Recipe)
class RecipeAdmin(ModelAdminJalaliMixin, nested_admin.NestedModelAdmin):
    form = RecipeAdminForm
    list_display = ("name", "product", "instruction", "prepared_time")
    list_filter = ("product",)
    search_fields = ("product", "created_at")
    readonly_fields = ("created_at", "updated_at")
    inlines = [RecipeComponentInline]

    def save_related(self, request, form, formsets, change):
        with transaction.atomic():
            super().save_related(request, form, formsets, change)
            normalize_components(form.instance)


class RecipeInline(nested_admin.NestedTabularInline):
    """Used inside Product admin form."""

    model = Recipe
    extra = 0
    fields = (
        "instruction",
        "prepared_time",
    )
    inlines = [RecipeComponentInline]
    form = RecipeInlineForm
