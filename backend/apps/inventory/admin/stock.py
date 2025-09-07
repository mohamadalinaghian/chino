from django.contrib import admin
from jalali_date.admin import ModelAdminJalaliMixin

from ..forms import StockForm
from ..models import Stock


@admin.register(Stock)
class StockAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    form = StockForm
