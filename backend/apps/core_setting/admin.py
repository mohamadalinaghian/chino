from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import SiteSettings


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = (
        "profit_margin",
        "tax_rate",
        "jalali_date",
    )
    readonly_fields = ("singleton_key", "jalali_date")

    @admin.display(description=_("Jalali update date"))
    def jalali_date(self, obj):
        return obj.jalali_update_date

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()
