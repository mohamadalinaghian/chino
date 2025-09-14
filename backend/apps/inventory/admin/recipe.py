from django.contrib import admin

from ..models import Recipe
from ..services import RecipeComponentService, RecipeService
from .recipe_component import RecipeComponentInline


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
    inlines = (RecipeComponentInline,)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # create object using service
        # to validate.
        RecipeService.create_or_update_recipe(
            obj.name, obj.produced_product, obj.instruction
        )

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)

        # normalize components after all related objects are saved
        RecipeComponentService.normalize_quantity(form.instance.id)
