"""
Admin forms for Sale app that integrate with service layer.
"""
from decimal import Decimal

from django import forms
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from ..models import Sale, SaleInvoice, SalePayment

User = get_user_model()


class SaleAdminForm(forms.ModelForm):
    """
    Admin form for Sale that validates basic fields.
    Item creation handled through inlines.
    """

    class Meta:
        model = Sale
        fields = (
            "sale_type",
            "table",
            "guest_count",
            "guest",
            "note",
        )

    def clean_guest_count(self):
        """Validate guest count is positive."""
        guest_count = self.cleaned_data.get("guest_count")
        if guest_count is not None and guest_count <= 0:
            raise ValidationError(_("Guest count must be positive"))
        return guest_count

    def clean(self):
        """Validate business rules."""
        cleaned_data = super().clean()
        sale_type = cleaned_data.get("sale_type")
        table = cleaned_data.get("table")

        if sale_type == Sale.SaleType.DINE_IN and not table:
            raise ValidationError(_("Table is required for dine-in sales"))

        return cleaned_data


class SaleInvoiceAdminForm(forms.ModelForm):
    """
    Admin form for SaleInvoice with tax amount input.
    """

    tax_amount = forms.DecimalField(
        label=_("Tax amount"),
        initial=Decimal("0.0000"),
        max_digits=12,
        decimal_places=4,
        required=False,
        help_text=_("Tax amount to apply (default: 0)"),
    )

    class Meta:
        model = SaleInvoice
        fields = ("sale", "tax_amount")

    def clean_sale(self):
        """Validate sale is CLOSED."""
        sale = self.cleaned_data.get("sale")
        if sale and sale.state != Sale.State.CLOSED:
            raise ValidationError(_("Can only create invoices for CLOSED sales"))
        return sale


class SalePaymentAdminForm(forms.ModelForm):
    """
    Admin form for SalePayment with proper validation.
    """

    class Meta:
        model = SalePayment
        fields = (
            "invoice",
            "method",
            "amount_applied",
            "tip_amount",
            "destination_account",
        )

    def clean_amount_applied(self):
        """Validate amount is positive."""
        amount = self.cleaned_data.get("amount_applied")
        if amount and amount <= 0:
            raise ValidationError(_("Payment amount must be positive"))
        return amount

    def clean_tip_amount(self):
        """Validate tip is non-negative."""
        tip = self.cleaned_data.get("tip_amount")
        if tip is None:
            return Decimal("0.0000")
        if tip < 0:
            raise ValidationError(_("Tip amount cannot be negative"))
        return tip

    def clean(self):
        """Validate total payment."""
        cleaned_data = super().clean()
        amount_applied = cleaned_data.get("amount_applied", Decimal("0"))
        tip_amount = cleaned_data.get("tip_amount", Decimal("0"))

        # Validate total matches
        total = amount_applied + tip_amount
        if total <= 0:
            raise ValidationError(_("Total payment amount must be positive"))

        return cleaned_data
