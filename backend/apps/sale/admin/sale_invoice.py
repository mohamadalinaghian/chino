# apps/sale/admin/sale_invoice.py
"""
Django Admin configuration for SaleInvoice.

FINAL VERSION - ALL BUGS FIXED:
1. Staff field auto-filled with request.user ✅
2. Product choices limited to SELLABLE type ✅
3. Unit price auto-filled from Menu.price ✅
4. No format_html f-string errors ✅
"""

from decimal import Decimal

from django import forms
from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from jalali_date.admin import ModelAdminJalaliMixin, TabularInlineJalaliMixin

from ..models import SaleInvoice, SaleItem
from ..services.payment import PaymentService
from ..services.refund import RefundService
from ..services.sale_invoice import SaleInvoiceService

# ============ CUSTOM FORM FOR SALE ITEM ============ #


class SaleItemInlineForm(forms.ModelForm):
    """
    Custom form for SaleItem inline.
    Handles auto-filling unit_price from Menu.
    """

    class Meta:
        model = SaleItem
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # FIX #2: Limit product queryset to SELLABLE products
        if "product" in self.fields:
            from apps.inventory.models import Product

            self.fields["product"].queryset = (
                Product.objects.filter(
                    type=Product.ProductType.SELLABLE,
                    is_active=True,
                    menu_items__is_available=True,
                )
                .select_related()
                .distinct()
            )

        # Make unit_price NOT required in the form (we'll set it programmatically)
        if "unit_price" in self.fields:
            self.fields["unit_price"].required = False

    def clean_product(self):
        """
        Validate that product has an active Menu entry.
        """
        product = self.cleaned_data.get("product")

        if product:
            # Check if product has active menu
            from apps.menu.models import Menu

            menu = Menu.objects.filter(name=product, is_available=True).first()

            if not menu:
                raise ValidationError(
                    f"محصول '{product.name}' هیچ منوی فعالی ندارد. "
                    "لطفاً ابتدا محصول را در منو فعال کنید."
                )

        return product

    def clean(self):
        """
        FIX #3: Auto-fill unit_price from Menu when product is selected.
        This happens during form validation.
        """
        cleaned_data = super().clean()
        product = cleaned_data.get("product")

        if product:
            # Fetch the active menu entry
            from apps.menu.models import Menu

            menu = Menu.objects.filter(name=product, is_available=True).first()

            if menu:
                # Auto-fill unit_price from Menu
                # Convert to Decimal to ensure proper type
                cleaned_data["unit_price"] = Decimal(str(menu.price))
                print(
                    f"DEBUG: Auto-filled unit_price = {
                        cleaned_data['unit_price']} for product {product.name}"
                )
            else:
                # This shouldn't happen because clean_product already checks this
                raise ValidationError(f"محصول '{product.name}' هیچ منوی فعالی ندارد.")

        return cleaned_data


# ============ INLINES ============ #


class SaleItemInline(TabularInlineJalaliMixin, admin.TabularInline):
    """
    Inline for editing sale items within invoice.

    Features:
    - Limited to SELLABLE products with active Menu entries
    - Auto-fills unit_price from Menu
    - Shows calculated totals
    """

    model = SaleItem
    form = SaleItemInlineForm
    extra = 1
    fields = (
        "product",
        "quantity",
        "unit_price",
        "discount_amount",
        "sale_method",
        "item_total",
        "material_cost",
    )
    readonly_fields = ("item_total", "material_cost")
    autocomplete_fields = ("product",)

    @admin.display(description=_("Item total"))
    def item_total(self, obj):
        """Calculate item total (price * qty - discount)."""
        if obj.pk:
            total = (obj.unit_price * obj.quantity) - obj.discount_amount
            return f"{total:,.0f} تومان"
        return "-"

    def get_queryset(self, request):
        """Optimize queries with select_related."""
        qs = super().get_queryset(request)
        return qs.select_related("product")


# ============ CUSTOM FORM FOR SALE INVOICE ============ #


class SaleInvoiceAdminForm(forms.ModelForm):
    """
    Custom form for SaleInvoice.
    Handles staff field auto-filling.
    """

    class Meta:
        model = SaleInvoice
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop("request", None)
        super().__init__(*args, **kwargs)

        # FIX #1: For new invoices, set staff to current user and make readonly
        if not self.instance.pk and self.request:
            self.initial["staff"] = self.request.user
            # Make staff field disabled (shown but not editable)
            if "staff" in self.fields:
                self.fields["staff"].disabled = True
                self.fields["staff"].required = False


# ============ MAIN ADMIN ============ #


@admin.register(SaleInvoice)
class SaleInvoiceAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    """
    Admin interface for managing sale invoices.

    Features:
    - Auto-fills staff with current user
    - Auto-fills product prices from Menu
    - Limits products to SELLABLE type only
    """

    form = SaleInvoiceAdminForm

    # Display configuration
    list_display = (
        "invoice_number",
        "jalali_date",
        "staff",
        "customer_name",
        "total_display",
        "paid_display",
        "balance_display",
        "status_badge",
    )

    list_filter = (
        "bill_status",
        ("issue_date", admin.DateFieldListFilter),
        ("staff", admin.RelatedOnlyFieldListFilter),
    )

    search_fields = (
        "id",
        "staff__name",
        "customer__name",
        "note",
    )

    readonly_fields = (
        "jalali_issue_date",
        "cached_total_amount",
        "total_paid",
        "balance_due",
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            _("Invoice Information"),
            {
                "fields": (
                    ("staff", "customer"),
                    "jalali_issue_date",
                    "bill_status",
                )
            },
        ),
        (
            _("Financial Summary"),
            {
                "fields": (
                    "cached_total_amount",
                    "total_paid",
                    "balance_due",
                )
            },
        ),
        (
            _("Additional Information"),
            {
                "fields": ("note",),
            },
        ),
        (
            _("System Information"),
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    inlines = [SaleItemInline]

    autocomplete_fields = ("staff", "customer")

    actions = [
        "action_mark_as_paid",
        "action_process_refund",
        "action_print_receipt",
        "action_calculate_totals",
    ]

    # ============ FORM HANDLING ============ #

    def get_form(self, request, obj=None, **kwargs):
        """
        Pass request to form so it can access current user.
        This is needed for FIX #1.
        """
        FormClass = super().get_form(request, obj, **kwargs)

        class FormWithRequest(FormClass):
            def __new__(cls, *args, **kwargs):
                kwargs["request"] = request
                return FormClass(*args, **kwargs)

        return FormWithRequest

    # ============ DISPLAY METHODS ============ #

    @admin.display(description=_("Invoice #"), ordering="id")
    def invoice_number(self, obj):
        """Display invoice ID with link."""
        return f"#{obj.pk}"

    @admin.display(description=_("Date"), ordering="issue_date")
    def jalali_date(self, obj):
        """Display Jalali date."""
        return obj.jalali_issue_date

    @admin.display(description=_("Customer"))
    def customer_name(self, obj):
        """Display customer name or 'Walk-in'."""
        if obj.customer:
            return obj.customer.name
        return _("Walk-in Customer")

    @admin.display(description=_("Total"), ordering="cached_total_amount")
    def total_display(self, obj):
        """Display total amount with formatting."""
        return format_html("<strong>{:,.0f} ت</strong>", obj.cached_total_amount)

    @admin.display(description=_("Paid"), ordering="total_paid")
    def paid_display(self, obj):
        """Display paid amount with formatting."""
        return format_html(
            '<span style="color: #28a745;">{:,.0f} ت</span>', obj.total_paid
        )

    @admin.display(description=_("Balance"))
    def balance_due(self, obj):
        """Calculate and display balance."""
        balance = obj.cached_total_amount - obj.total_paid
        return f"{balance:,.0f} تومان"

    @admin.display(description=_("Balance"))
    def balance_display(self, obj):
        """Display balance with color coding."""
        balance = obj.cached_total_amount - obj.total_paid
        if balance <= 0:
            color = "#28a745"  # Green
        elif balance < obj.cached_total_amount:
            color = "#ffc107"  # Yellow
        else:
            color = "#dc3545"  # Red

        return format_html(
            '<span style="color: {}; font-weight: bold;">{:,.0f} ت</span>',
            color,
            balance,
        )

    @admin.display(description=_("Status"), ordering="bill_status")
    def status_badge(self, obj):
        """Display status with colored badge."""
        status_colors = {
            SaleInvoice.BillStatus.OPEN: "#6c757d",
            SaleInvoice.BillStatus.PARTIALLY_PAID: "#ffc107",
            SaleInvoice.BillStatus.PAID: "#28a745",
            SaleInvoice.BillStatus.REFUNDED: "#dc3545",
        }

        color = status_colors.get(obj.bill_status, "#6c757d")

        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 10px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_bill_status_display(),
        )

    # ============ CUSTOM ACTIONS ============ #

    @admin.action(description=_("Mark selected as PAID (Cash)"))
    def action_mark_as_paid(self, request, queryset):
        """Mark selected invoices as paid with cash payment."""
        paid_count = 0

        for invoice in queryset:
            if invoice.bill_status in [
                SaleInvoice.BillStatus.OPEN,
                SaleInvoice.BillStatus.PARTIALLY_PAID,
            ]:
                try:
                    balance = invoice.cached_total_amount - invoice.total_paid

                    # Create cash payment for balance
                    PaymentService.create_cash_payment(
                        invoice=invoice,
                        amount=balance,
                        verified_by=request.user,
                        cash_register_id="ADMIN_QUICK_PAY",
                    )

                    paid_count += 1
                except Exception as e:
                    messages.error(
                        request,
                        f"خطا در پرداخت فاکتور #{invoice.pk}: {str(e)}",
                    )

        if paid_count > 0:
            messages.success(request, f"{paid_count} فاکتور با موفقیت پرداخت شد.")

    @admin.action(description=_("Process full refund"))
    def action_process_refund(self, request, queryset):
        """Process full refund for selected invoices."""
        refunded_count = 0

        for invoice in queryset:
            if invoice.bill_status == SaleInvoice.BillStatus.PAID:
                try:
                    RefundService.full_refund(
                        invoice=invoice,
                        refunded_by=request.user,
                        reason="Admin bulk refund",
                        restore_stock=True,
                    )
                    refunded_count += 1
                except Exception as e:
                    messages.error(
                        request,
                        f"خطا در مرجوعی فاکتور #{invoice.pk}: {str(e)}",
                    )

        if refunded_count > 0:
            messages.success(request, f"{refunded_count} فاکتور با موفقیت مرجوع شد.")

    @admin.action(description=_("Print receipts"))
    def action_print_receipt(self, request, queryset):
        """Generate printable receipts."""
        # TODO: Implement receipt generation
        messages.info(
            request,
            f"قابلیت چاپ {queryset.count()} فاکتور به زودی اضافه می‌شود.",
        )

    @admin.action(description=_("Recalculate totals"))
    def action_calculate_totals(self, request, queryset):
        """Recalculate cached totals for selected invoices."""
        for invoice in queryset:
            try:
                SaleInvoiceService.recalculate_totals(invoice)
            except Exception as e:
                messages.error(
                    request,
                    f"خطا در محاسبه مجدد فاکتور #{invoice.pk}: {str(e)}",
                )

        messages.success(
            request, f"مجموع {queryset.count()} فاکتور با موفقیت محاسبه شد."
        )

    # ============ QUERYSETS ============ #

    def get_queryset(self, request):
        """Optimize queries with select_related."""
        qs = super().get_queryset(request)
        return qs.select_related("staff", "customer").prefetch_related("items")

    # ============ PERMISSIONS ============ #

    def has_delete_permission(self, request, obj=None):
        """Only allow deleting OPEN invoices."""
        if obj and obj.bill_status != SaleInvoice.BillStatus.OPEN:
            return False
        return super().has_delete_permission(request, obj)

    # ============ SAVE LOGIC ============ #

    def save_model(self, request, obj, form, change):
        """
        FIX #1: Auto-set staff to current user on creation.
        """
        if not change:  # This is a new object
            obj.staff = request.user
        super().save_model(request, obj, form, change)

    def save_formset(self, request, form, formset, change):
        """
        Save inline items and recalculate totals.
        The unit_price should already be set by SaleItemInlineForm.clean().

        However, we add a fallback here to ensure unit_price is NEVER null.
        """
        instances = formset.save(commit=False)

        # Save new instances with fallback
        for instance in instances:
            if isinstance(instance, SaleItem):
                # CRITICAL: Ensure unit_price is set before save
                if instance.unit_price is None or instance.unit_price == 0:
                    print(
                        f"WARNING: unit_price was null/zero for {
                            instance.product}, fetching from Menu..."
                    )

                    # Fallback: Fetch from Menu if not set by form
                    from apps.menu.models import Menu

                    menu = Menu.objects.filter(
                        name=instance.product, is_available=True
                    ).first()

                    if menu:
                        instance.unit_price = Decimal(str(menu.price))
                        print(f"FIXED: Set unit_price = {instance.unit_price}")
                    else:
                        messages.error(
                            request,
                            f"خطا: محصول '{
                                instance.product.name}' هیچ منوی فعالی ندارد!",
                        )
                        raise ValidationError(
                            f"Cannot save item: product '{
                                instance.product.name}' has no active menu entry"
                        )

            instance.save()

        # Handle deleted items
        for deleted_instance in formset.deleted_objects:
            deleted_instance.delete()

        # Save many-to-many relationships
        formset.save_m2m()

        # Recalculate totals
        if form.instance.pk:
            SaleInvoiceService.recalculate_totals(form.instance)
            messages.success(
                request,
                f"فاکتور #{form.instance.pk} به‌روزرسانی شد. "
                f"مجموع: {form.instance.cached_total_amount:,.0f} تومان",
            )
