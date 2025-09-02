from django import forms
from django.utils.translation import gettext_lazy as _


class PurcahseInvoiceForm(forms.ModelForm):
    """
    Dispaly of a complete invoice with tax and discount.
    """

    # TODO add tax and discount fields for all of purchases
    tax = forms.DecimalField(
        label=_("Tax persent"),
        max_digits=2,
        decimal_places=1,
        help_text=_("Amount of tax that appliy to total cost"),
        required=False,
    )
    discount = forms.DecimalField(
        label=_("Discount persent"),
        max_digits=2,
        decimal_places=1,
        help_text=_("Amount of discount on purchasing this item"),
        required=False,
    )
