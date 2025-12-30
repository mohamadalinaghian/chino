from decimal import Decimal

from apps.sale.models import SalePayment, SaleRefund
from apps.sale.policies import can_refund_payment
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from .issue_payment_service import IssuePaymentService


class CreateRefundService:
    """
    Creates a refund linked to an original payment.

    Rules:
        - Refund <= original payment applied amount
        - Tips are NOT refundable
        - Refunds update invoice status
    """

    @classmethod
    @transaction.atomic
    def execute(
        cls,
        *,
        payment: SalePayment,
        refunded_by,
        amount: Decimal,
        reason: str,
    ) -> SaleRefund:
        can_refund_payment(refunded_by, payment)

        if payment.status != SalePayment.PaymentStatus.COMPLETED:
            raise ValidationError(_("Only completed payments can be refunded"))

        if amount <= 0:
            raise ValidationError(_("Refund amount must be positive"))

        if amount > payment.amount_applied:
            raise ValidationError(_("Refund exceeds original payment amount"))

        refund = SaleRefund.objects.create(
            payment=payment,
            invoice=payment.invoice,
            amount=amount,
            refunded_by=refunded_by,
            reason=reason,
        )

        payment.status = SalePayment.PaymentStatus.VOID
        payment.save(update_fields=["status"])

        IssuePaymentService._update_invoice_status(payment.invoice)
        return refund
