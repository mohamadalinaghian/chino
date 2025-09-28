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
        "title",
        "related_product",
        "category",
        "price",
        "is_available",
        "move_up_down_links",
    )
    list_filter = ("category", "is_available")
    search_fields = ("title", "description")
    filter_horizontal = ("images",)
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ["category", "related_product"]
    list_editable = ("price", "related_product")
