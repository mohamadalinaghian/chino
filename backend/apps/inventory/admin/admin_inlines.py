import nested_admin
from django.utils.translation import gettext_lazy as _
from apps.inventory.models import Recipe, RecipeComponent
from apps.inventory.form import RecipeInlineForm, RecipeComponentFormSet


class RecipeComponentInline(nested_admin.NestedTabularInline):
    """
    Inline for RecipeComponent.
    """

    model = RecipeComponent
    formset = RecipeComponentFormSet
    extra = 1
    fields = ("component", "quantity")


class RecipeInline(nested_admin.NestedGenericTabularInline):
    model = Recipe
    form = RecipeInlineForm
    extra = 1
    show_change_link = True
    max_num = 1
    fields = (
        "produce_unit",
        "product_unit_amount",
        "instructions",
        "cook_time_minutes",
    )
    inlines = [RecipeComponentInline]

    class Media:
        js = ("admin/js/recipe_sum_qty.js",)

    def get_formset(self, request, obj=None, **kwargs):
        FormSet = super().get_formset(request, obj, **kwargs)
        FormSet.form.base_fields["product_unit_amount"].disabled = True
        if obj:
            total = sum(c.quantity for c in obj.components.all())
            FormSet.form.base_fields["product_unit_amount"].initial = total
        return FormSet
