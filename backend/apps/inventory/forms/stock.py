from django import forms
from django.utils.translation import gettext_lazy as _
from jalali_date.admin import AdminJalaliDateWidget

from ..models import Stock


class StockForm(forms.ModelForm):
    class Meta:
        model = Stock
        fields = (
            "stored_product",
            "initial_quantity",
            "unit_price",
            "remaining_quantity",
            "create_at",
        )
        widgets = {"create_at": AdminJalaliDateWidget}

    def clean(self):
        """
        Remaining quantity must be smaller than initial.
        """

        cleaned = super().clean()

        initial_quantity = cleaned["initial_quantity"]
        remaining_quantity = cleaned["remaining_quantity"]

        if remaining_quantity > initial_quantity:
            raise forms.ValidationError(
                _("Remaining quantity can not be greater than initial.")
            )
