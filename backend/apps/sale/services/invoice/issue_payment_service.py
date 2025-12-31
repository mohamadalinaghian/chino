from decimal import Decimal
from typing import Optional

from apps.sale.models import SaleInvoice, SalePayment
from apps.sale.policies import can_issue_payment
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils.translation import gettext_lazy as _


class IssuePaymentService:
    """
    Issues a payment against an invoice.

    Rules:
        - Invoice must not be VOID
        - Payments are append-only
        - Invoice status auto-updates
        - Tips live ONLY here
    """

    @classmethod
    @transaction.atomic
    def execute(
        cls,
        *,
        invoice: SaleInvoice,
        received_by,
        method: SalePayment.PaymentMethod,
        amount_applied: Decimal,
        tip_amount: Decimal = Decimal("0"),
        destination_account=None,
        sale_item_ids: Optional[list[int]] = None,
    ) -> SalePayment:
        can_issue_payment(received_by, invoice)

        if invoice.status == SaleInvoice.InvoiceStatus.VOID:
            raise ValidationError(_("Cannot pay a void invoice"))

        if amount_applied <= 0:
            raise ValidationError(_("Payment amount must be positive"))

        if tip_amount < 0:
            raise ValidationError(_("Tip amount cannot be negative"))

        # Validate sale items if provided
        if sale_item_ids:
            sale_items = invoice.sale.items.filter(id__in=sale_item_ids)
            if sale_items.count() != len(sale_item_ids):
                raise ValidationError(_("One or more sale items not found in this invoice"))

        amount_total = amount_applied + tip_amount

        payment = SalePayment.objects.create(
            invoice=invoice,
            method=method,
            amount_total=amount_total,
            amount_applied=amount_applied,
            tip_amount=tip_amount,
            destination_account=destination_account,
            received_by=received_by,
        )

        # Attach sale items if provided (for split payments)
        if sale_item_ids:
            payment.sale_items.set(sale_item_ids)

        cls._update_invoice_status(invoice)
        return payment

    @staticmethod
    def _update_invoice_status(invoice: SaleInvoice) -> None:
        paid_total = invoice.payments.filter(
            status=SalePayment.PaymentStatus.COMPLETED
        ).aggregate(total=models.Sum("amount_applied"))["total"] or Decimal("0")

        if paid_total == Decimal("0"):
            invoice.status = SaleInvoice.InvoiceStatus.UNPAID
        elif paid_total < invoice.total_amount:
            invoice.status = SaleInvoice.InvoiceStatus.PARTIALLY_PAID
        else:
            invoice.status = SaleInvoice.InvoiceStatus.PAID

        invoice.save(update_fields=["status"])
