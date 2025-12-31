from decimal import Decimal
from typing import Optional

from apps.sale.models import Sale, SaleInvoice
from apps.sale.policies import can_create_invoice
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class InitiateInvoiceService:
    """
    Creates an invoice for an OPEN sale to start the payment process.

    This differs from CreateInvoiceService in that:
    - Sale must be OPEN (not CLOSED)
    - This starts the payment flow
    - Sale will be closed later when payment is complete

    Rules:
        - Sale must be OPEN
        - Sale must have at least one item
        - Sale must not already have an invoice
        - Totals are snapshotted and never recalculated later
    """

    @classmethod
    @transaction.atomic
    def execute(
        cls,
        *,
        sale: Sale,
        issued_by,
        tax_amount: Decimal = Decimal("0"),
        invoice_number: Optional[str] = None,
    ) -> SaleInvoice:
        """
        Initiate an invoice from an OPEN sale.

        Args:
            sale: Sale instance (must be OPEN)
            issued_by: User creating the invoice
            tax_amount: Tax amount to apply (optional)
            invoice_number: Custom invoice number (optional, auto-generated if not provided)

        Returns:
            SaleInvoice instance with status UNPAID

        Raises:
            ValidationError: If sale is not OPEN, has no items, or already has invoice
            PermissionDenied: If user lacks permission
        """
        can_create_invoice(issued_by, sale)

        # Validate sale state
        if sale.state != Sale.State.OPEN:
            raise ValidationError(_("Sale must be OPEN to initiate invoice"))

        # Validate sale has items
        if not sale.items.exists():
            raise ValidationError(_("Cannot create invoice for empty sale"))

        # Check if invoice already exists - return existing if not VOID (idempotent)
        if hasattr(sale, "invoice"):
            existing_invoice = sale.invoice
            # If existing invoice is VOID, allow creating a new one
            if existing_invoice.status != SaleInvoice.InvoiceStatus.VOID:
                return existing_invoice
            # If VOID, we'll create a new one below

        # Calculate totals
        subtotal = sale.total_amount or Decimal("0")

        discount_total = (
            sale.discounts.aggregate(total=models.Sum("value"))["total"]
            if sale.discounts.exists()
            else Decimal("0")
        )

        # Generate invoice number if not provided
        if not invoice_number:
            invoice_number = cls._generate_invoice_number()

        # Create invoice
        invoice = SaleInvoice.objects.create(
            sale=sale,
            invoice_number=invoice_number,
            subtotal_amount=subtotal,
            discount_amount=discount_total,
            tax_amount=tax_amount,
            issued_by=issued_by,
            issued_at=timezone.now(),
            status=SaleInvoice.InvoiceStatus.UNPAID,
            total_amount=subtotal - discount_total + tax_amount,
        )

        return invoice

    @staticmethod
    def _generate_invoice_number() -> str:
        """
        Generate sequential invoice number in format: INV-YYYY-NNNNNN

        Returns:
            str: Unique invoice number
        """
        from django.db.models import Max

        current_year = timezone.now().year
        prefix = f"INV-{current_year}-"

        # Get last invoice number for this year
        last_invoice = SaleInvoice.objects.filter(
            invoice_number__startswith=prefix
        ).aggregate(Max("invoice_number"))["invoice_number__max"]

        if last_invoice:
            # Extract sequence number and increment
            try:
                last_seq = int(last_invoice.split("-")[-1])
                next_seq = last_seq + 1
            except (ValueError, IndexError):
                next_seq = 1
        else:
            next_seq = 1

        return f"{prefix}{next_seq:06d}"
