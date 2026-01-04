from apps.menu.models import CategoryAnalytics, Menu, MenuCategory, MenuItemAnalytics
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


@admin.register(MenuItemAnalytics)
class MenuItemAnalyticsAdmin(admin.ModelAdmin):
    list_display = (
        "menu_item",
        "selection_count_today",
        "selection_count_week",
        "selection_count_month",
        "selection_count_all_time",
        "rank_today",
        "rank_week",
        "last_selected_at",
    )
    list_filter = ("last_selected_at",)
    search_fields = ("menu_item__name__name",)
    readonly_fields = (
        "created_at",
        "updated_at",
        "last_selected_at",
    )
    ordering = ("rank_week", "rank_today")


@admin.register(CategoryAnalytics)
class CategoryAnalyticsAdmin(admin.ModelAdmin):
    list_display = (
        "category",
        "selection_count_today",
        "selection_count_week",
        "selection_count_month",
        "rank",
    )
    search_fields = ("category__title",)
    readonly_fields = ("created_at", "updated_at")
    ordering = ("rank",)
