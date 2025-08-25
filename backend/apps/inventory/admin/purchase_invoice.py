from django import forms
from django.contrib import admin
from jalali_date.admin import ModelAdminJalaliMixin
from jalali_date.widgets import AdminJalaliDateWidget

from ..models import PurchaseInvoice


class PurchaseInvoiceAdminForm(forms.ModelForm):
    class Meta:
        model = PurchaseInvoice
        fields = "__all__"
        widget = {
            "issue_date": AdminJalaliDateWidget,
        }


@admin.register(PurchaseInvoice)
class PurchaseInvoiceAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):

    form = PurchaseInvoiceAdminForm
    list_display = ("issue_date", "staff", "supplier")
    list_editable = ("staff", "supplier")
    search_fields = ("issue_date", "staff", "supplier")
    list_filter = ("issue_date", "staff", "supplier")
    autocomplete_fields = ("supplier",)
    date_hierarchy = "issue_date"
