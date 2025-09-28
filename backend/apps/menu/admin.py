from apps.menu.models import Menu, MenuCategory
from django.contrib import admin
from ordered_model.admin import OrderedModelAdmin


@admin.register(MenuCategory)
class MenuCategoryAdmin(OrderedModelAdmin):
    list_display = ("title", "description", "move_up_down_links")
    search_fields = ("title",)
    readonly_fields = ("slug",)


@admin.register(Menu)
class MenuAdmin(OrderedModelAdmin):
    list_display = (
        "name",
        "category",
        "price",
        "is_available",
        "move_up_down_links",
    )
    list_filter = ("category", "is_available")
    search_fields = ("name", "description")
    filter_horizontal = ("images",)
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ["category", "name"]
    list_editable = ("price", "name")
