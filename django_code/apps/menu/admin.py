from apps.menu.models import Menu, MenuCategory
from django.contrib import admin
from ordered_model.admin import OrderedModelAdmin


@admin.register(MenuCategory)
class MenuCategoryAdmin(OrderedModelAdmin):
    list_display = ("title", "move_up_down_links")
    search_fields = ("title",)
    readonly_fields = ("slug",)
    prepopulated_fields = {"slug": ("title",)}
