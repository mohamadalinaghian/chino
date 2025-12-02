from decimal import Decimal

from django.contrib import admin
from jalali_date.admin import ModelAdminJalaliMixin

from ..forms import ItemProductionForm
from ..models import ItemProduction
from ..services import ItemProductionService, StockService


@admin.register(ItemProduction)
class ItemProductionAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    form = ItemProductionForm
    list_display = (
        "used_recipe__produced_product",
        "produced_quantity",
    )
    readonly_fields = ("updated_at",)
    search_fields = ("used_recipe__produced_product__name", "cooperators__name")
    autocomplete_fields = ("used_recipe",)

    def save_model(self, request, obj, form, change):
        """
        Override the save_model to calculate the total cost, unit cost,
        and record the produced item in stock.
        """
        # Step 1: Calculate the total cost of production
        # and update quantity of component after usage
        total_cost = ItemProductionService.get_production_total_cost(
            obj.used_recipe, obj.produced_quantity
        )

        # Step 2: Calculate unit cost (total_cost divided by produced quantity)
        if obj.produced_quantity > 0:
            unit_cost = total_cost / obj.produced_quantity
        else:
            unit_cost = Decimal("0")

        # Step 3: Record the produced item in the stock
        # Add produced item to stock
        StockService.add_to_stock(
            obj.used_recipe.produced_product,
            unit_cost,
            obj.produced_quantity,
        )

        # Save the object with the updated fields
        super().save_model(request, obj, form, change)
