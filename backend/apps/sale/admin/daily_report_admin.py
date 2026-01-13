import re
from datetime import timedelta
from decimal import Decimal
from typing import Any

from django import forms
from django.contrib import admin
from django.http.request import HttpRequest
from django.utils.translation import gettext_lazy as _
from jalali_date.admin import ModelAdminJalaliMixin
from jalali_date.widgets import AdminJalaliDateWidget
from persiantools.jdatetime import JalaliDate

from ...utils.jalali_date_list_filter import JalaliDateFieldListFilter
from ..models import DailyReport
from ..services.report.create_daily_report_service import (
    CreateDailyReportService as CDR,
)


class DailyReportForm(forms.ModelForm):
    class Meta:
        model = DailyReport
        fields = (
            "report_date",
            "status",
            "opening_float",
            "closing_cash_counted",
            "pos_report",
            "notes",
        )
        widgets = {
            "report_date": AdminJalaliDateWidget,
        }

    pos_report = forms.DecimalField(label=_("Pos report"), initial=Decimal("0"))


@admin.register(DailyReport)
class DailyReportAdmin(
    ModelAdminJalaliMixin,
    admin.ModelAdmin,
):
    list_display = ("jalali_report_date", "status", "total_revenue")
    form = DailyReportForm

    readonly_fields = ("status",)
    list_filter = (JalaliDateFieldListFilter,)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pos_report = self.actual_pos_report or Decimal("0")

    def save_form(self, request: HttpRequest, form: Any, change: Any) -> Any:
        super().save_form(request, form, change)
        f = form.cleaned_data["pos_report"]
        of = form.cleaned_data["opening_float"]
        cl = form.cleaned_data["closing_cash_counted"]
        r = form.cleaned_data["report_date"]
        n = form.cleaned_data["notes"]

        return CDR.execute(
            created_by=request.user,
            opening_float=of,
            pos_total_report=f,
            closing_cash_counted=cl,
            report_date=r,
            notes=n,
        )

    #
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
