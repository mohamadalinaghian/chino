from decimal import Decimal

from apps.sale.models import Sale, SaleInvoice
from apps.sale.policies import can_close_sale
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
    ) -> SaleInvoice:
        can_close_sale(issued_by, sale)

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

        invoice = SaleInvoice.objects.create(
            sale=sale,
            subtotal_amount=subtotal,
            discount_amount=discount_total,
            tax_amount=tax_amount,
            issued_by=issued_by,
            issued_at=timezone.now(),
            status=SaleInvoice.InvoiceStatus.UNPAID,
            total_amount=subtotal - discount_total + tax_amount,
        )

        return invoice
