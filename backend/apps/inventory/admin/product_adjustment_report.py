from django import forms
from django.contrib import admin
from jalali_date.admin import ModelAdminJalaliMixin
from jalali_date.widgets import AdminJalaliDateWidget

from ...utils.jalali_date_list_filter import JalaliDateFieldListFilter
from ..models import ProductAdjustmentReport
from ..services import ProductAdjustmentService


class ProductAdjustmentReportForm(forms.ModelForm):
    class Meta:
        model = ProductAdjustmentReport
        fields = "__all__"
        widgets = {"report_date": AdminJalaliDateWidget}


@admin.register(ProductAdjustmentReport)
class ProductAdjustmentReportAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    form = ProductAdjustmentReportForm
    list_display = (
        "product",
        "jalali_report_date",
    )
    fields = ("report_date", "product", "staff", "current_quantity")
    search_fields = ("jalali_report_date", "product")
    list_filter = (
        JalaliDateFieldListFilter,
        "product",
        ("staff", admin.RelatedOnlyFieldListFilter),
    )
    autocomplete_fields = ("product", "staff")

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)

        ProductAdjustmentService.adjust_product(
            obj.product, obj.staff, obj.current_quantity
        )
