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
