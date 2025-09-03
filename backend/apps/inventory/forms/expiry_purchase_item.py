from django import forms
from jalali_date.admin import AdminJalaliDateWidget

from ..models import ExpiryPurchaseItem
from ..services import ExpiryPurchaseItemService


class ExpiryPurchaseItemForm(forms.ModelForm):
    class Meta:
        model = ExpiryPurchaseItem
        fields = ("purchased_item",)
        widgets = {
            "expiry_date": AdminJalaliDateWidget,
        }

    def clean_expiry_date(self):
        """
        Date must be in feature.
        """
        date = self.cleaned_data["expiry_date"]
        ExpiryPurchaseItemService.date_validation(date)
        return date
