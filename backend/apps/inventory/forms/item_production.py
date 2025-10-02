from django import forms
from jalali_date.widgets import AdminJalaliDateWidget

from ..models import ItemProduction


class ItemProductionForm(forms.ModelForm):
    class Meta:
        model = ItemProduction
        fields = "__all__"
        widgets = {
            "created_at": AdminJalaliDateWidget,
        }
