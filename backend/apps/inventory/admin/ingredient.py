from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.admin import GenericTabularInline
from apps.inventory.models import Ingredient
from apps.inventory.models import Recipe, RecipeComponent


class RecipeComponentInline(admin.TabularInline):
    model = RecipeComponent
    extra = 1
    fields = ("component", "quantity")


class RecipeInline(GenericTabularInline):
    model = Recipe
    extra = 1
    fields = ("instructions", "cook_time_minutes")
    inlines = [RecipeComponentInline]


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ("name", "ingredient_type", "unit")
    list_filter = ("ingredient_type",)
    search_fields = ("name", "unit")
    fieldsets = ((None, {"fields": ("name", "unit", "ingredient_type")}),)
    inlines = [RecipeInline]

    # show recipe for processed ingredients
