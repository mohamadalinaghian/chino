from django_code.apps.menu.models import Menu, MenuCategory
from django.contrib import admin
from ordered_model.admin import OrderedModelAdmin


@admin.register(MenuCategory)
class MenuCategoryAdmin(OrderedModelAdmin):
    list_display = ("title", "move_up_down_links")
    search_fields = ("title",)
    readonly_fields = ("slug",)


@admin.register(Menu)
class MenuAdmin(OrderedModelAdmin):
    list_display = (
        "title",
        "category",
        "price",
        "is_available",
        "move_up_down_links",
    )
    list_filter = ("category", "is_available")
    search_fields = ("title", "description")
    filter_horizontal = ("images",)
    prepopulated_fields = {"slug": ("title",)}  # ← این خط مهمه

    # def thumbnail_preview(self, obj):
    #     if obj.thumbnail:
    #         return format_html(
    #             '<img src="{}" width="40" height="40" />', obj.thumbnail.url
    #         )
    #     return "—"
    #
    # thumbnail_preview.short_description = "تصویر"
