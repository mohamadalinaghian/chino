from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.admin import GenericTabularInline
from apps.inventory.models import Ingredient
from apps.inventory.admin.admin_inlines import RecipeInline


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ("name", "ingredient_type", "unit")
    list_filter = ("ingredient_type",)
    search_fields = ("name", "unit")
    fieldsets = ((None, {"fields": ("name", "unit", "ingredient_type")}),)
    inlines = [RecipeInline]

    # show recipe for processed ingredients
