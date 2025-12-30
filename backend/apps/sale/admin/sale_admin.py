from django.contrib import admin
from django.db.models import Count, Sum
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from ..models import Sale, SaleDiscount, SaleItem


class SaleItemInline(admin.TabularInline):
    """Inline for sale items."""

    model = SaleItem
    extra = 0
    fields = (
        "product",
        "quantity",
        "unit_price",
        "total_price",
        "note",
    )
    readonly_fields = ("total_price",)
    autocomplete_fields = ["product"]

    def total_price(self, obj):
        """Display calculated total price."""
        if obj.pk:
            return format_html(
                '<strong>{}</strong>',
                obj.quantity * obj.unit_price
            )
        return "-"

    total_price.short_description = _("Total")


class SaleDiscountInline(admin.TabularInline):
    """Inline for sale discounts."""

    model = SaleDiscount
    extra = 0
    fields = ("discount_type", "value", "reason")


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    """Admin for Sale model - POS transaction management."""

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

    autocomplete_fields = ["guest", "table"]

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

    state_badge.short_description = _("State")

    def items_count(self, obj):
        """Display number of items in sale."""
        if obj.pk:
            count = obj.items.count()
            return format_html('<strong>{}</strong>', count)
        return "-"

    items_count.short_description = _("Items")

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
            html += f"<td><strong>{item.quantity * item.unit_price}</strong></td></tr>"
        html += "</table>"
        return format_html(html)

    items_summary.short_description = _("Items Details")

    def discounts_summary(self, obj):
        """Display summary of all discounts."""
        if not obj.pk:
            return "-"

        discounts = obj.discounts.all()
        if not discounts:
            return _("No discounts")

        total = sum(d.value for d in discounts)
        html = f'<p><strong>Total Discount: {total}</strong></p>'
        html += "<ul>"
        for discount in discounts:
            html += f"<li>{discount.get_discount_type_display()}: {discount.value}"
            if discount.reason:
                html += f" ({discount.reason})"
            html += "</li>"
        html += "</ul>"
        return format_html(html)

    discounts_summary.short_description = _("Discounts")

    def get_queryset(self, request):
        """Optimize queryset with related data."""
        qs = super().get_queryset(request)
        return qs.select_related(
            "opened_by",
            "closed_by",
            "guest",
            "table",
        ).prefetch_related("items", "discounts")

    def has_add_permission(self, request):
        """Prevent adding sales through admin - use POS service."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Prevent deleting sales through admin."""
        return False
