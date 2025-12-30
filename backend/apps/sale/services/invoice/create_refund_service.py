from decimal import Decimal

from apps.sale.models import SalePayment, SaleRefund
from apps.sale.policies import can_refund_payment
from django.core.exceptions import ValidationError
from django.db import models, transaction
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
        method: SaleRefund.Method,
    ) -> SaleRefund:
        can_refund_payment(refunded_by, payment)

        if payment.status != SalePayment.PaymentStatus.COMPLETED:
            raise ValidationError(_("Only completed payments can be refunded"))

        if amount <= 0:
            raise ValidationError(_("Refund amount must be positive"))

        # Check total refunds don't exceed payment
        total_refunded = payment.refunds.filter(
            status=SaleRefund.Status.COMPLETED
        ).aggregate(total=models.Sum("amount"))["total"] or Decimal("0")

        if total_refunded + amount > payment.amount_applied:
            raise ValidationError(
                _(
                    "Total refunds (%(total)s + %(amount)s) exceed payment amount (%(payment)s)"
                )
                % {
                    "total": total_refunded,
                    "amount": amount,
                    "payment": payment.amount_applied,
                }
            )

        # Default to same method as original payment
        if method is None:
            method = SaleRefund.Method[payment.method]

        refund = SaleRefund.objects.create(
            payment=payment,
            invoice=payment.invoice,
            amount=amount,
            method=method,
            processed_by=refunded_by,
            reason=reason,
        )

        # Only void payment if fully refunded
        if total_refunded + amount >= payment.amount_applied:
            payment.status = SalePayment.PaymentStatus.VOID
            payment.save(update_fields=["status"])

        IssuePaymentService._update_invoice_status(payment.invoice)
        return refund
