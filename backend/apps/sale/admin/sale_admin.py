from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from ..models import Sale, SaleDiscount, SaleItem
from ..services.sale.close_sale import CloseSaleService
from ..services.sale.open_sale import OpenSaleService
from .forms import SaleAdminForm


class SaleItemInline(admin.TabularInline):
    """Inline for sale items."""

    model = SaleItem
    extra = 1
    fields = (
        "product",
        "quantity",
        "unit_price",
        "total_price",
    )
    readonly_fields = ("unit_price", "total_price")
    autocomplete_fields = ["product"]

    def get_queryset(self, request):
        """Only show parent items (not extras)."""
        qs = super().get_queryset(request)
        return qs.filter(parent_item__isnull=True)

    @admin.display(description=_("Total"))
    def total_price(self, obj):
        """Display calculated total price."""
        if obj.pk:
            return format_html("<strong>{}</strong>", obj.quantity * obj.unit_price)
        return "-"

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Filter product to only show Menu items."""
        if db_field.name == "product":
            from apps.menu.models import Menu
            # Get all product IDs that are in Menu
            menu_product_ids = Menu.objects.values_list('name_id', flat=True)
            kwargs["queryset"] = db_field.related_model.objects.filter(
                id__in=menu_product_ids
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class SaleDiscountInline(admin.TabularInline):
    """Inline for sale discounts."""

    model = SaleDiscount
    extra = 0
    fields = ("discount_type", "value", "reason")


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    """Admin for Sale model - POS transaction management."""

    form = SaleAdminForm

    list_display = (
        "id",
        "state_badge",
        "sale_type",
        "table",
        "guest_count",
        "total_amount",
        "items_count",
        "opened_by",
        "opened_at",
        "closed_at",
    )

    list_filter = (
        "state",
        "sale_type",
        "opened_at",
        "closed_at",
    )

    search_fields = (
        "id",
        "table__name",
        "guest__username",
        "opened_by__username",
        "note",
    )

    readonly_fields = (
        "state",
        "total_amount",
        "opened_at",
        "closed_at",
        "created_at",
        "updated_at",
        "opened_by",
        "closed_by",
        "items_summary",
        "discounts_summary",
    )

    fieldsets = (
        (
            _("Sale Information"),
            {
                "fields": (
                    "state",
                    "sale_type",
                    "table",
                    "guest_count",
                    "guest",
                )
            },
        ),
        (
            _("Financial Summary"),
            {
                "fields": (
                    "total_amount",
                    "items_summary",
                    "discounts_summary",
                )
            },
        ),
        (
            _("Staff & Timeline"),
            {
                "fields": (
                    "opened_by",
                    "opened_at",
                    "closed_by",
                    "closed_at",
                )
            },
        ),
        (
            _("Additional Information"),
            {
                "fields": ("note",),
                "classes": ("collapse",),
            },
        ),
        (
            _("System"),
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    inlines = [SaleItemInline, SaleDiscountInline]

    date_hierarchy = "opened_at"

    ordering = ("-opened_at",)

    # autocomplete_fields = ["guest", "table"]

    actions = ["close_sales"]

    @admin.display(description=_("State"))
    def state_badge(self, obj):
        """Display state with color badge."""
        colors = {
            Sale.State.OPEN: "green",
            Sale.State.CLOSED: "blue",
            Sale.State.CANCELED: "red",
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            colors.get(obj.state, "gray"),
            obj.get_state_display(),
        )

    @admin.display(description=_("Items"))
    def items_count(self, obj):
        """Display number of items in sale."""
        if obj.pk:
            count = obj.items.count()
            return format_html("<strong>{}</strong>", count)
        return "-"

    @admin.display(description=_("Items Details"))
    def items_summary(self, obj):
        """Display summary of all items."""
        if not obj.pk:
            return "-"

        items = obj.items.all()
        if not items:
            return _("No items")

        html = '<table style="width: 100%;">'
        html += "<tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>"
        for item in items:
            html += f"<tr><td>{item.product.name}</td>"
            html += f"<td>{item.quantity}</td>"
            html += f"<td>{item.unit_price}</td>"
            html += f"<td><strong>{item.quantity *
                                   item.unit_price}</strong></td></tr>"
        html += "</table>"
        return format_html(html)

    @admin.display(description=_("Discounts"))
    def discounts_summary(self, obj):
        """Display summary of all discounts."""
        if not obj.pk:
            return "-"

        discounts = obj.discounts.all()
        if not discounts:
            return _("No discounts")

        total = sum(d.value for d in discounts)
        html = f"<p><strong>Total Discount: {total}</strong></p>"
        html += "<ul>"
        for discount in discounts:
            html += f"<li>{discount.get_discount_type_display()
                           }: {discount.value}"
            if discount.reason:
                html += f" ({discount.reason})"
            html += "</li>"
        html += "</ul>"
        return format_html(html)

    def get_queryset(self, request):
        """Optimize queryset with related data."""
        qs = super().get_queryset(request)
        return qs.select_related(
            "opened_by",
            "closed_by",
            "guest",
            "table",
        ).prefetch_related("items", "discounts")

    def save_model(self, request, obj, form, change):
        """Use service layer for sale management."""
        if not change:  # Creating new sale
            # Store data for use in save_formset
            self._pending_sale_data = {
                "opened_by": request.user,
                "sale_type": obj.sale_type,
                "table": obj.table,
                "guest_count": obj.guest_count,
                "guest": obj.guest,
                "note": obj.note,
            }
        else:  # Updating existing sale
            if obj.state != Sale.State.OPEN:
                messages.error(request, _("Only OPEN sales can be modified"))
                return
            super().save_model(request, obj, form, change)

    def save_formset(self, request, form, formset, change):
        """Handle item creation through service layer."""
        if not change and formset.model == SaleItem:
            # Creating new sale with items
            from apps.menu.models import Menu
            items_data = []

            for item_form in formset.forms:
                if item_form.cleaned_data and not item_form.cleaned_data.get("DELETE", False):
                    product = item_form.cleaned_data.get("product")
                    quantity = item_form.cleaned_data.get("quantity")

                    if product and quantity:
                        # Auto-fill unit_price from Menu
                        try:
                            menu = Menu.objects.get(name=product)
                            unit_price = menu.price
                        except Menu.DoesNotExist:
                            messages.error(
                                request,
                                f"Product '{product.name}' is not in menu. Please select a menu item."
                            )
                            return

                        items_data.append({
                            "product": product,
                            "quantity": quantity,
                            "unit_price": unit_price,
                        })

            if not items_data:
                messages.error(request, _("Sale must contain at least one item"))
                return

            try:
                with transaction.atomic():
                    sale_data = self._pending_sale_data
                    sale = Sale.objects.create(
                        opened_by=sale_data["opened_by"],
                        sale_type=sale_data["sale_type"],
                        table=sale_data["table"],
                        guest_count=sale_data["guest_count"],
                        guest=sale_data["guest"],
                        note=sale_data["note"],
                        state=Sale.State.OPEN,
                    )

                    # Create items with price from Menu
                    for item_data in items_data:
                        SaleItem.objects.create(
                            sale=sale,
                            product=item_data["product"],
                            quantity=item_data["quantity"],
                            unit_price=item_data["unit_price"],
                        )

                    # Recalculate total using service
                    OpenSaleService.recalculate_total(sale)
                    form.instance = sale

                messages.success(request, _("Sale created successfully"))
            except (ValidationError, PermissionDenied) as e:
                messages.error(request, str(e))
                raise
        else:
            # Normal formset save
            super().save_formset(request, form, formset, change)
            if change and formset.model == SaleItem:
                # Recalculate total after item changes
                OpenSaleService.recalculate_total(form.instance)

    @admin.action(description=_("Close selected sales"))
    def close_sales(self, request, queryset):
        """Close selected OPEN sales using service."""
        success_count = 0
        for sale in queryset:
            try:
                CloseSaleService.close_sale(sale=sale, closed_by=request.user)
                success_count += 1
            except (PermissionDenied, ValidationError) as e:
                self.message_user(
                    request, f"Failed to close sale {sale.id}: {str(e)}", level=messages.ERROR
                )

        if success_count:
            self.message_user(
                request, f"Successfully closed {success_count} sale(s)", level=messages.SUCCESS
            )

    def has_add_permission(self, request):
        """Allow adding sales through admin with minimal requirements."""
        return request.user.has_perm("sale.add_sale")

    def has_delete_permission(self, request, obj=None):
        """Prevent deleting sales - use cancel action instead."""
        return False
