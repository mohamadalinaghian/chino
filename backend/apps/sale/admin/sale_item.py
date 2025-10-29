from django import forms
from django.contrib import admin
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from ..models import SaleItem
from ..services import SaleItemService


class SaleItemPOSForm(forms.ModelForm):
    class Meta:
        model = SaleItem
        fields = ("product", "quantity", "sold_unit_price")
        widgets = {
            "quantity": forms.NumberInput(attrs={"step": "0.001", "min": "0.001"}),
        }

    def clean(self):
        cleaned = super().clean()
        product = cleaned.get("product")
        qty = cleaned.get("quantity")
        price = cleaned.get("sold_unit_price")

        if product and qty and price:
            # 1. Sellable?
            SaleItemService.is_saleable(product.pk)
            # 2. Price reasonable?
            SaleItemService.is_price_reasonable(product.pk)
            # 3. FIFO / phantom (deferred to save_model)
        return cleaned


class SaleItemPOSInline(admin.StackedInline):
    model = SaleItem
    form = SaleItemPOSForm
    extra = 0
    fields = ("product", "quantity", "sold_unit_price", "total_cost")
    readonly_fields = ("total_cost",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("product")

    @admin.display(description=_("Line totalj"))
    def total_cost(self, obj):
        return obj.total_cost if obj.pk else "-"

    # ------------------------------------------------------------------
    #  AJAX endpoint that creates a SaleItem from a product button click
    # ------------------------------------------------------------------
    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)

        class POSFormSet(formset):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                # inject the invoice pk into every empty form
                if obj:
                    for form in self.forms:
                        if not form.instance.pk:
                            form.instance.sale_invoice = obj

        return POSFormSet

    # ------------------------------------------------------------------
    #  Save hook – runs the StockService exactly as your original code
    # ------------------------------------------------------------------
    def save_model(self, request, obj, form, change):
        # `obj` is a SaleItem instance
        with transaction.atomic():
            super().save_model(request, obj, form, change)

            # Determine sale method (you already have a field or a rule)
            sale_method = SaleItem.SaleMethod.STOCK  # default
            if obj.product.type == obj.product.ProductType.PHANTOM:
                sale_method = SaleItem.SaleMethod.PHANTOM

            SaleItemService.fifo_consume(
                product_id=obj.product_id,
                quantity=obj.quantity,
                item_sale_mchanism=sale_method,
            )
