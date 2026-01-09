from apps.menu.models import Menu, MenuCategory
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from ordered_model.admin import OrderedModelAdmin


@admin.register(MenuCategory)
class MenuCategoryAdmin(OrderedModelAdmin):
    list_display = ("title", "description", "move_up_down_links")
    search_fields = ("title",)
    readonly_fields = ("slug",)


@admin.register(Menu)
class MenuAdmin(OrderedModelAdmin):
    list_display = (
        "id",
        "name",
        "category",
        "material_cost_dis",
        "suggest_price_dis",
        "price",
        "is_available",
        "move_up_down_links",
    )
    list_filter = ("category", "is_available")
    search_fields = ("name__name", "description")
    filter_horizontal = ("images",)
    autocomplete_fields = ["category", "name"]
    list_editable = ("price",)

    @admin.display(description=_("Suggested price"))
    def suggest_price_dis(self, obj):
        return obj.suggested_price

    @admin.display(description=_("Material cost"))
    def material_cost_dis(self, obj):
        return obj.material_cost
