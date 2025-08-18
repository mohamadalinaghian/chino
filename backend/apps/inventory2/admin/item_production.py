from django import forms
from django.contrib import admin, messages
from django.db import transaction
from ..models import ItemProduction
from jalali_date.admin import AdminJalaliDateWidget, ModelAdminJalaliMixin
from ..services.item_production_service import ItemProductionService
from apps.inventory2.exceptions import InsufficientStockError


class ItemProductionForm(forms.ModelForm):
    """
    Admin form for ItemProduction.
    Validate M2M 'creators' here instead of model.clean().
    """

    class Meta:
        model = ItemProduction
        fields = "__all__"
        widgets = {
            "created_at": AdminJalaliDateWidget,
        }

    def clean_creators(self):
        """
        Ensure all selected creators are staff members.
        This runs in the form context, safe to access M2M queryset.
        """
        creators = self.cleaned_data.get("creators")
        if creators is not None and creators.filter(is_staff=False).exists():
            raise forms.ValidationError("Creators must be staff members.")
        return creators


@admin.register(ItemProduction)
class ItemProductionAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    """
    Admin for ItemProduction.
    - Set product from recipe before saving (so instance has correct FK).
    - Save main object (get PK), then save M2M via form.save_m2m(),
        then call production service. This order guarantees M2M and PK exist.
    """

    form = ItemProductionForm

    list_display = (
        "product",
        "recipe",
        "input_quantity",
        "output_quantity",
        "total_cost",
        "created_at",
    )
    readonly_fields = ("created_at", "updated_at")
    list_filter = ("product", "recipe", "creators")
    search_fields = ("product__name", "recipe__name", "creators__name")
    autocomplete_fields = ("recipe", "creators")

    fields = (
        "product",
        "recipe",
        "input_quantity",
        "output_quantity",
        "creators",
        "notes",
        "created_at",
        "updated_at",
    )

    def add_view(self, request, form_url="", extra_context=None):
        """
        Wrap the entire add view in a DB transaction so that:
        - save_model (persist instance, get PK),
        - save_related (save M2M),
        - and production service all run in one atomic transaction.
        If processing fails, whole transaction is rolled back.
        """
        with transaction.atomic():
            return super().add_view(request, form_url, extra_context)

    def change_view(self, request, object_id, form_url="", extra_context=None):
        """
        Wrap change view as well for consistency on edits.
        """
        with transaction.atomic():
            return super().change_view(request, object_id, form_url, extra_context)

    def save_model(self, request, obj, form, change):
        """
        Set product based on recipe (if provided) and save the main object.
        This ensures obj has a PK before M2M are saved.
        """
        if obj.recipe_id and not obj.product_id:
            obj.product = obj.recipe.product
        # call super to persist the instance (assign PK)
        super().save_model(request, obj, form, change)

    @transaction.atomic
    def save_related(self, request, form, formsets, change):
        """
        After main instance is saved, Django calls save_related to persist M2M
        and inlines. Here we ensure M2M are saved and then run production service.
        The service runs inside the same transaction for atomicity.
        """
        # let admin save related objects (this does form.save_m2m())
        super().save_related(request, form, formsets, change)

        try:
            # call service to perform FIFO consumption and create produced stock
            unit_cost = ItemProductionService.create_stock_for_production(form.instance)

            # update production record with calculated costs
            form.instance.unit_cost = unit_cost
            form.instance.total_cost = unit_cost * form.instance.output_quantity
            form.instance.save(update_fields=["unit_cost", "total_cost"])

            messages.success(request, f"Production processed. Unit cost: {unit_cost}")
        except InsufficientStockError as e:
            messages.error(request, f"Insufficient stock: {e}")
            raise
        except Exception as e:
            messages.error(request, f"Production processing failed: {e}")
            raise
