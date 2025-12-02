"""
Django Admin configuration for Transaction and payment models.

Features:
- View all transactions
- Filter by payment type, date, verification status
- Group transactions by invoice
- Verification actions
"""

from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from jalali_date.admin import ModelAdminJalaliMixin

from ..models import CardToCardTransaction, CashTransaction, PosTransaction, Transaction

# ============ INLINES ============ #


class PosTransactionInline(admin.StackedInline):
    """Inline for POS transaction details."""

    model = PosTransaction
    extra = 0
    fields = ("target_account",)
    autocomplete_fields = ("target_account",)

    def has_add_permission(self, request, obj=None):
        """Cannot add POS details from here."""
        return False


class CashTransactionInline(admin.StackedInline):
    """Inline for cash transaction details."""

    model = CashTransaction
    extra = 0
    fields = ("cash_register_id",)

    def has_add_permission(self, request, obj=None):
        """Cannot add cash details from here."""
        return False


class CardToCardTransactionInline(admin.StackedInline):
    """Inline for card-to-card transaction details."""

    model = CardToCardTransaction
    extra = 0
    fields = ("destination_account",)
    autocomplete_fields = ("destination_account",)

    def has_add_permission(self, request, obj=None):
        """Cannot add card transfer details from here."""
        return False


# ============ MAIN ADMIN ============ #


@admin.register(Transaction)
class TransactionAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    """
    Admin interface for managing payment transactions.

    Features:
    - View all payments
    - Filter by type, date, verification
    - Search by invoice ID
    - Verification actions
    """

    # Display configuration
    list_display = (
        "id",
        "invoice_link",
        "payment_type_badge",
        "amount_display",
        "jalali_date",
        "verified_badge",
        "verified_by_display",
    )

    list_filter = (
        "payment_type",
        "is_verified",
        ("payment_date", admin.DateFieldListFilter),
        ("verified_by", admin.RelatedOnlyFieldListFilter),
    )

    search_fields = (
        "id",
        "invoice__id",
        "note",
    )

    readonly_fields = (
        "invoice",
        "amount",
        "payment_type",
        "jalali_payment_date",
        "is_verified",
        "verified_by",
        "verification_date",
        "updated_at",
    )

    fieldsets = (
        (
            _("Transaction Information"),
            {
                "fields": (
                    "invoice",
                    "amount",
                    "payment_type",
                    "jalali_payment_date",
                )
            },
        ),
        (
            _("Verification"),
            {
                "fields": (
                    "is_verified",
                    "verified_by",
                    "verification_date",
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
                "fields": ("updated_at",),
                "classes": ("collapse",),
            },
        ),
    )

    # Conditionally show inlines based on payment type
    def get_inlines(self, request, obj):
        """Show appropriate inline based on payment type."""
        if obj and obj.payment_type == Transaction.PaymentType.POS:
            return [PosTransactionInline]
        elif obj and obj.payment_type == Transaction.PaymentType.CASH:
            return [CashTransactionInline]
        elif obj and obj.payment_type == Transaction.PaymentType.CARD_TO_CARD:
            return [CardToCardTransactionInline]
        return []

    # ============ DISPLAY METHODS ============ #

    def invoice_link(self, obj):
        """Display invoice number with link."""
        from django.urls import reverse

        url = reverse("admin:sale_saleinvoice_change", args=[obj.invoice.pk])
        return format_html('<a href="{}">فاکتور #{}</a>', url, obj.invoice.pk)

    invoice_link.short_description = _("Invoice")
    invoice_link.admin_order_field = "invoice"

    def payment_type_badge(self, obj):
        """Display payment type with colored badge."""
        colors = {
            Transaction.PaymentType.POS: "#007bff",
            Transaction.PaymentType.CASH: "#28a745",
            Transaction.PaymentType.CARD_TO_CARD: "#ffc107",
        }

        icons = {
            Transaction.PaymentType.POS: "💳",
            Transaction.PaymentType.CASH: "💵",
            Transaction.PaymentType.CARD_TO_CARD: "🔄",
        }

        color = colors.get(obj.payment_type, "#6c757d")
        icon = icons.get(obj.payment_type, "💰")

        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 10px; border-radius: 3px; font-size: 11px;">'
            "{} {}</span>",
            color,
            icon,
            obj.get_payment_type_display(),
        )

    payment_type_badge.short_description = _("Payment Type")
    payment_type_badge.admin_order_field = "payment_type"

    def amount_display(self, obj):
        """Display amount with formatting."""
        return format_html(
            '<strong style="color: #28a745;">{:,.0f} ت</strong>', obj.amount
        )

    amount_display.short_description = _("Amount")
    amount_display.admin_order_field = "amount"

    def jalali_date(self, obj):
        """Display Jalali payment date."""
        return obj.jalali_payment_date

    jalali_date.short_description = _("Payment Date")
    jalali_date.admin_order_field = "payment_date"

    def verified_badge(self, obj):
        """Display verification status with badge."""
        if obj.is_verified:
            return format_html(
                '<span style="color: #28a745; font-weight: bold;">✓ تایید شده</span>'
            )
        else:
            return format_html(
                '<span style="color: #dc3545; font-weight: bold;">✗ تایید نشده</span>'
            )

    verified_badge.short_description = _("Status")
    verified_badge.admin_order_field = "is_verified"

    def verified_by_display(self, obj):
        """Display who verified the transaction."""
        if obj.verified_by:
            return obj.verified_by.name
        return "-"

    verified_by_display.short_description = _("Verified By")

    # ============ QUERYSETS ============ #

    def get_queryset(self, request):
        """Optimize queries."""
        qs = super().get_queryset(request)
        return qs.select_related("invoice", "verified_by")

    # ============ PERMISSIONS ============ #

    def has_add_permission(self, request):
        """Transactions should be created through PaymentService."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Transactions should not be deleted."""
        return False

    def has_change_permission(self, request, obj=None):
        """Transactions are readonly."""
        return request.user.is_superuser


# ============ PAYMENT TYPE ADMINS ============ #


@admin.register(PosTransaction)
class PosTransactionAdmin(admin.ModelAdmin):
    """Admin for POS transaction details."""

    list_display = (
        "transaction_id",
        "invoice_link",
        "amount_display",
        "target_account",
        "jalali_date",
    )

    list_filter = (("transaction__payment_date", admin.DateFieldListFilter),)

    search_fields = (
        "transaction__id",
        "transaction__invoice__id",
        "target_account__account_owner",
    )

    readonly_fields = (
        "transaction",
        "target_account",
    )

    def transaction_id(self, obj):
        """Display transaction ID."""
        return f"#{obj.transaction.pk}"

    transaction_id.short_description = _("Transaction")

    def invoice_link(self, obj):
        """Display invoice link."""
        from django.urls import reverse

        url = reverse(
            "admin:sale_saleinvoice_change", args=[obj.transaction.invoice.pk]
        )
        return format_html(
            '<a href="{}">فاکتور #{}</a>', url, obj.transaction.invoice.pk
        )

    invoice_link.short_description = _("Invoice")

    def amount_display(self, obj):
        """Display amount."""
        return f"{obj.transaction.amount:,.0f} تومان"

    amount_display.short_description = _("Amount")

    def jalali_date(self, obj):
        """Display payment date."""
        return obj.transaction.jalali_payment_date

    jalali_date.short_description = _("Date")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(CashTransaction)
class CashTransactionAdmin(admin.ModelAdmin):
    """Admin for cash transaction details."""

    list_display = (
        "transaction_id",
        "invoice_link",
        "amount_display",
        "cash_register_id",
        "jalali_date",
    )

    list_filter = (("transaction__payment_date", admin.DateFieldListFilter),)

    search_fields = (
        "transaction__id",
        "transaction__invoice__id",
        "cash_register_id",
    )

    readonly_fields = (
        "transaction",
        "cash_register_id",
    )

    def transaction_id(self, obj):
        return f"#{obj.transaction.pk}"

    transaction_id.short_description = _("Transaction")

    def invoice_link(self, obj):
        from django.urls import reverse

        url = reverse(
            "admin:sale_saleinvoice_change", args=[obj.transaction.invoice.pk]
        )
        return format_html(
            '<a href="{}">فاکتور #{}</a>', url, obj.transaction.invoice.pk
        )

    invoice_link.short_description = _("Invoice")

    def amount_display(self, obj):
        return f"{obj.transaction.amount:,.0f} تومان"

    amount_display.short_description = _("Amount")

    def jalali_date(self, obj):
        return obj.transaction.jalali_payment_date

    jalali_date.short_description = _("Date")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(CardToCardTransaction)
class CardToCardTransactionAdmin(admin.ModelAdmin):
    """Admin for card-to-card transaction details."""

    list_display = (
        "transaction_id",
        "invoice_link",
        "amount_display",
        "destination_account",
        "jalali_date",
    )

    list_filter = (("transaction__payment_date", admin.DateFieldListFilter),)

    search_fields = (
        "transaction__id",
        "transaction__invoice__id",
        "destination_account__account_owner",
    )

    readonly_fields = (
        "transaction",
        "destination_account",
    )

    def transaction_id(self, obj):
        return f"#{obj.transaction.pk}"

    transaction_id.short_description = _("Transaction")

    def invoice_link(self, obj):
        from django.urls import reverse

        url = reverse(
            "admin:sale_saleinvoice_change", args=[obj.transaction.invoice.pk]
        )
        return format_html(
            '<a href="{}">فاکتور #{}</a>', url, obj.transaction.invoice.pk
        )

    invoice_link.short_description = _("Invoice")

    def amount_display(self, obj):
        return f"{obj.transaction.amount:,.0f} تومان"

    amount_display.short_description = _("Amount")

    def jalali_date(self, obj):
        return obj.transaction.jalali_payment_date

    jalali_date.short_description = _("Date")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
