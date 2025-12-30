from decimal import Decimal

from apps.sale.models import Sale, SaleInvoice
from apps.sale.policies import can_create_invoice
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class CreateInvoiceService:
    """
    Creates an immutable invoice snapshot for a CLOSED sale.

    Rules:
        - Sale must be CLOSED
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
        invoice_number: str = None,
    ) -> SaleInvoice:
        can_create_invoice(issued_by, sale)

        if sale.state != Sale.State.CLOSED:
            raise ValidationError(_("Sale must be CLOSED before invoicing"))

        if hasattr(sale, "invoice"):
            raise ValidationError(_("Invoice already exists for this sale"))

        subtotal = sale.total_amount or Decimal("0")

        discount_total = (
            sale.discounts.aggregate(total=models.Sum("value"))["total"]
            if sale.discounts.exists()
            else Decimal("0")
        )

        # Generate invoice number if not provided
        if not invoice_number:
            invoice_number = cls._generate_invoice_number()

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
        last_invoice = (
            SaleInvoice.objects.filter(invoice_number__startswith=prefix)
            .aggregate(Max("invoice_number"))["invoice_number__max"]
        )

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
