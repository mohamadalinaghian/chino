from django.contrib import admin

from ..models import Recipe
from ..services.recipe import RecipeService


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    model = Recipe
    list_display = ("name", "produced_product", "instruction", "jalali_created_at")
    fields = (
        "name",
        "produced_product",
        "instruction",
        "jalali_created_at",
        "jalali_updated_at",
    )
    readonly_fields = ("jalali_created_at", "jalali_updated_at")

    def save_model(self, request, obj, form, change):
        # create object using service
        # to validate.
        RecipeService.create_or_update_recipe(
            obj.name, obj.produced_product, obj.instruction
        )
