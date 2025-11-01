import re
from datetime import timedelta

from django import forms
from django.contrib import admin
from django.db import transaction
from jalali_date.admin import ModelAdminJalaliMixin
from jalali_date.widgets import AdminJalaliDateWidget
from persiantools.jdatetime import JalaliDate

from ...utils.jalali_date_list_filter import JalaliDateFieldListFilter
from ..models import AdjustmentReportSession
from ..services import ProductAdjustmentService
from .mixins import ValidationErrorMessageMixin
from .product_adjustment_report import ProductAdjustmentReportInline


class AdjustmentReportSessionForm(forms.ModelForm):
    class Meta:
        model = AdjustmentReportSession
        fields = "__all__"
        widgets = {"report_date": AdminJalaliDateWidget}


@admin.register(AdjustmentReportSession)
class AdjustmentReportSessionAdmin(
    ValidationErrorMessageMixin, ModelAdminJalaliMixin, admin.ModelAdmin
):
    inlines = (ProductAdjustmentReportInline,)
    list_display = ("jalali_report_date", "staff")
    list_select_related = ("staff",)
    search_fields = ("staff__name",)
    list_filter = (
        JalaliDateFieldListFilter,
        ("staff", admin.RelatedOnlyFieldListFilter),
    )
    autocomplete_fields = ("staff",)
    ordering = ("-report_date",)

    def save_related(self, request, form, formsets, change):
        """
        For adjusting products and add report.
        """
        super().save_related(request, form, formsets, change)
        session_obj = form.instance

        with transaction.atomic():
            for formset in formsets:
                for f in formset.forms:
                    if not hasattr(f, "cleaned_data"):
                        continue
                    cd = getattr(f, "cleaned_data", None)
                    if not cd or cd.get("DELETE"):
                        continue
                    if hasattr(f, "has_changed") and not f.has_changed():
                        continue
                    product = cd.get("product")
                    current_quantity = cd.get("current_quantity")
                    if product is None or current_quantity is None:
                        continue

                    ProductAdjustmentService.adjust_product(
                        product=product,
                        session=session_obj,
                        current_quantity=current_quantity,
                    )

    # jalali searh

    def _parse_jalali_range(self, term: str):
        term = term.strip()
        m = re.match(r"^(\d{4})(?:[\/-](\d{1,2})(?:[\/-](\d{1,2}))?)?$", term)
        if not m:
            return None
        y = int(m.group(1))
        mm = m.group(2)
        dd = m.group(3)
        if mm is None:
            start = JalaliDate(y, 1, 1).to_gregorian()
            end = JalaliDate(y + 1, 1, 1).to_gregorian()
        elif dd is None:
            month = int(mm)
            start = JalaliDate(y, month, 1).to_gregorian()
            if month == 12:
                end = JalaliDate(y + 1, 1, 1).to_gregorian()
            else:
                end = JalaliDate(y, month + 1, 1).to_gregorian()
        else:
            start = JalaliDate(y, int(mm), int(dd)).to_gregorian()
            end = start + timedelta(days=1)
        return start, end

    def get_search_results(self, request, queryset, search_term):
        qs, use_distinct = super().get_search_results(request, queryset, search_term)

        r = self._parse_jalali_range(search_term)
        if r:
            start, end = r
            qs |= queryset.filter(report_date__gte=start, report_date__lt=end)
            use_distinct = True

        if search_term.isdigit():
            try:
                qs |= queryset.filter(id=int(search_term))
                use_distinct = True
            except ValueError:
                pass

        return qs, use_distinct
