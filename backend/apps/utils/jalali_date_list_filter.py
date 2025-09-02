from datetime import timedelta

from django.contrib.admin import SimpleListFilter
from django.utils.translation import gettext_lazy as _
from persiantools.jdatetime import JalaliDate


class JalaliDateFieldListFilter(SimpleListFilter):
    """
    A Jalali version of Django's DateFieldListFilter.
    Provides common options like today, yesterday, this week, last week, this month, last month, last 30 days.
    Works with DateField (stored in DB as Gregorian).
    """

    title = _("Jalali date")
    parameter_name = "jalali_date"

    def lookups(self, request, model_admin):
        # today = JalaliDate.today()
        # year, month, day = today.year, today.month, today.day

        lookups = [
            ("today", _("Today")),
            ("yesterday", _("Yesterday")),
            ("this_week", _("This week")),
            ("last_week", _("Last week")),
            ("this_month", _("This month")),
            ("last_month", _("Last month")),
            ("last_year", _("Last year")),
        ]
        return lookups

    def queryset(self, request, queryset):
        value = self.value()
        if not value:
            return queryset

        today = JalaliDate.today()
        if value == "today":
            start = today.to_gregorian()
            end = start + timedelta(days=1)
        elif value == "yesterday":
            start = (today - timedelta(days=1)).to_gregorian()
            end = start + timedelta(days=1)
        elif value == "this_week":
            weekday = today.weekday()  # 0=Monday
            start = (today - timedelta(days=weekday)).to_gregorian()
            end = start + timedelta(days=7)
        elif value == "last_week":
            weekday = today.weekday()
            start = (today - timedelta(days=weekday + 7)).to_gregorian()
            end = start + timedelta(days=7)
        elif value == "this_month":
            start = JalaliDate(today.year, today.month, 1).to_gregorian()
            if today.month == 12:
                end = JalaliDate(today.year + 1, 1, 1).to_gregorian()
            else:
                end = JalaliDate(today.year, today.month + 1, 1).to_gregorian()
        elif value == "last_month":
            month = today.month - 1
            year = today.year
            if month <= 0:
                month = 12
                year -= 1
            start = JalaliDate(year, month, 1).to_gregorian()
            if month == 12:
                end = JalaliDate(year + 1, 1, 1).to_gregorian()
            else:
                end = JalaliDate(year, month + 1, 1).to_gregorian()
        elif value == "last_year":
            start = (today - timedelta(days=365)).to_gregorian()
            end = today.to_gregorian() + timedelta(days=1)
        else:
            return queryset

        return queryset.filter(issue_date__gte=start, issue_date__lt=end)
