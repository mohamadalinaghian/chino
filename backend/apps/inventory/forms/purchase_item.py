from decimal import Decimal

from django import forms
from django.utils.translation import gettext_lazy as _
from jalali_date.admin import AdminJalaliDateWidget, JalaliDateField

from ..models import PurchaseItem
from ..services.purchase_item import ZERO, PurchaseItemService


class PurchaseItemInlineForm(forms.ModelForm):
    """
    Expose virtual fields so the user can input either:
    - a simple quantity, or
    - package-based input (quantity per package × number of packages),
    and optionally enter a total cost to back-calc the unit price.
    """

    class Meta:
        model = PurchaseItem
        fields = ("purchased_product", "quantity", "purchased_unit_price")
        localized_fields = (
            "purchased_unit_price",
            "total_cost",
            "package_quantity",
            "package_count",
            "quantity",
        )

    purchased_unit_price = forms.DecimalField(
        initial=ZERO,
        required=False,
        label=_("Unit price"),
    )

    quantity = forms.DecimalField(required=False, initial=ZERO, label=_("Quantity"))
    total_cost = forms.DecimalField(
        label=_("Total cost"),
        max_digits=10,
        decimal_places=2,
        help_text=_("Final cost for purchasing this item"),
        required=False,
    )
    brand = forms.CharField(
        label=_("Brand"),
        max_length=64,
        help_text=_("Add brand of item if supplier supply multiple kind of it"),
        required=False,
    )
    package_quantity = forms.DecimalField(
        label=_("Quantity per package"), max_digits=10, decimal_places=2, required=False
    )
    package_count = forms.DecimalField(
        label=_("Number of packages"), max_digits=10, decimal_places=2, required=False
    )
    expiry_date = JalaliDateField(
        label=_("Expiry date"), required=False, widget=AdminJalaliDateWidget
    )

    # Only positive numbers
    def clean_purchased_unit_price(self):
        _unit_price = self.cleaned_data["purchased_unit_price"]

        if _unit_price and _unit_price < ZERO:
            raise forms.ValidationError(_("Only positive numbers"))

        return _unit_price

    def clean_quantity(self):
        _quantity = self.cleaned_data["quantity"]

        if _quantity and _quantity < ZERO:
            raise forms.ValidationError(_("Only positive numbers"))

        return _quantity

    def clean_total_cost(self):
        _total_cost = self.cleaned_data["total_cost"]
        if _total_cost and _total_cost <= ZERO:
            raise forms.ValidationError(_("Only positive numbers"))
        return _total_cost

    def clean_package_count(self):
        _pakhage_count = self.cleaned_data["package_count"]
        if _pakhage_count and _pakhage_count <= ZERO:
            raise forms.ValidationError(_("Only positive numbers"))
        return _pakhage_count

    def clean_package_quantity(self):
        _package_quantity = self.cleaned_data["package_quantity"]
        if _package_quantity and _package_quantity <= ZERO:
            raise forms.ValidationError(_("Only positive numbers"))
        return _package_quantity

    ## TODO clean expiry date

    ## Big clean
    def clean(self):
        cleaned = super().clean()

        _product = cleaned.get("purchased_product")

        # if form is not empty:
        if _product:
            _unit_price = cleaned.get("purchased_unit_price")
            _quantity = cleaned.get("quantity")
            _brand = cleaned.get("brand")
            _total_cost = cleaned.get("total_cost")
            _package_quantity = cleaned.get("package_quantity")
            _package_count = cleaned.get("package_count")
            _expiry_date = cleaned.get("expiry_date")

            _service = PurchaseItemService()
            _final_qty = _service.valid_final_quantity(
                _quantity, _package_quantity, _package_count
            )

            _unit_price = _service.valid_unit_price(
                _product, _unit_price, _total_cost, _final_qty
            )

            from django.conf import settings

            _ratio = settings.PURCHASE_VALID_CHANGE_RATIO
            _ratio = Decimal(_ratio)

            if not _service.within_change_ratio(_product, _unit_price, _ratio):
                raise forms.ValidationError(
                    _(
                        "Unit price deviates too much from the last purchase price. Please confirm with a manager."
                    )
                )

            cleaned["purchased_unit_price"] = _unit_price
            cleaned["brand"] = _brand
            cleaned["expiry_date"] = _expiry_date
            cleaned["quantity"] = _final_qty
            cleaned["purchased_product"] = _product
            return cleaned
