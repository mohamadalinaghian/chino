import re
from datetime import timedelta

from django import forms
from django.contrib import admin
from jalali_date.admin import ModelAdminJalaliMixin
from jalali_date.widgets import AdminJalaliDateWidget
from persiantools.jdatetime import JalaliDate

from ...utils.jalali_date_list_filter import JalaliDateFieldListFilter
from ..models import PurchaseInvoice
from ..services import (
    ExpiryPurchaseItemService,
    ProductService,
    StockService,
    SupplierProductService,
)
from .purchase_item import PurchaseItemInline


# TODO Move to separate file
class PurchaseInvoiceAdminForm(forms.ModelForm):
    class Meta:
        model = PurchaseInvoice
        fields = "__all__"
        widgets = {
            "issue_date": AdminJalaliDateWidget,
        }


@admin.register(PurchaseInvoice)
class PurchaseInvoiceAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    form = PurchaseInvoiceAdminForm
    list_display = ("jalali_issue_date", "staff", "supplier")
    list_editable = ("staff", "supplier")
    list_select_related = ("staff", "supplier")
    list_per_page = 10
    search_fields = ("staff__name", "supplier__company_name")
    list_filter = (
        JalaliDateFieldListFilter,
        ("supplier", admin.RelatedOnlyFieldListFilter),
        ("staff", admin.RelatedOnlyFieldListFilter),
    )
    autocomplete_fields = ("supplier",)
    inlines = (PurchaseItemInline,)
    ordering = ("-issue_date",)

    def save_related(self, request, form, formsets, change):
        """
        Update SupplirProduct on supplier assignment.
        Update last_purchase_price in Product.
        """
        super().save_related(request, form, formsets, change)

        # update SupplierProduct price.
        invoice = form.instance
        sp_service = SupplierProductService()
        prod_service = ProductService()
        expiry_sv = ExpiryPurchaseItemService()

        # Update last price in Product and SupplierProduct
        for formset in formsets:
            for form in formset.forms:
                data = getattr(form, "cleaned_data", None)
                if not data or data.get("DELETE"):
                    continue

                product = form.cleaned_data["purchased_product"]
                price = form.cleaned_data["purchased_unit_price"]
                brand = form.cleaned_data.get("brand")
                expiry_date = form.cleaned_data.get("expiry_date")
                quantity = form.cleaned_data["quantity"]

                prod_service.update_last_price(product, price)

                if sp_service.has_supplier(invoice):
                    sp_service.update_supplier_product(invoice, product, price, brand)

                if expiry_date:
                    expiry_sv.add_expiry_date(form.instance, expiry_date)

                StockService.add_to_stock(product, price, quantity)

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
            qs |= queryset.filter(issue_date__gte=start, issue_date__lt=end)
            use_distinct = True

        if search_term.isdigit():
            try:
                qs |= queryset.filter(id=int(search_term))
                use_distinct = True
            except ValueError:
                pass

        return qs, use_distinct
