from typing import Optional

from apps.sale.models import SaleInvoice, SalePayment
from apps.sale.policies import can_cancel_invoice
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _


class CancelInvoiceService:
    """
    Cancel/void an invoice (rollback scenario).

    This is used when the user wants to abort the payment process:
    - Invoice status becomes VOID
    - Sale remains OPEN (user can continue ordering)
    - Cannot cancel if invoice has COMPLETED payments (must refund first)

    Use Cases:
    - Customer changes mind after seeing bill
    - Wrong items on invoice
    - Customer wants to add more items before paying
    """

    @classmethod
    @transaction.atomic
    def execute(
        cls,
        *,
        invoice: SaleInvoice,
        canceled_by,
        reason: Optional[str] = None,
    ) -> SaleInvoice:
        """
        Cancel an invoice and mark it as VOID.

        Args:
            invoice: Invoice to cancel
            canceled_by: User canceling the invoice
            reason: Optional cancellation reason

        Returns:
            Updated SaleInvoice with VOID status

        Raises:
            ValidationError: If invoice cannot be canceled
            PermissionDenied: If user lacks permission
        """
        # Check permission
        can_cancel_invoice(canceled_by, invoice)

        # Validate invoice is not already void
        if invoice.status == SaleInvoice.InvoiceStatus.VOID:
            raise ValidationError(_("Invoice is already voided"))

        # Check for completed payments
        has_completed_payments = invoice.payments.filter(
            status=SalePayment.PaymentStatus.COMPLETED
        ).exists()

        if has_completed_payments:
            raise ValidationError(
                _(
                    "Cannot cancel invoice with completed payments. "
                    "Please process refunds first."
                )
            )

        # Mark invoice as VOID
        invoice.status = SaleInvoice.InvoiceStatus.VOID
        invoice.save(update_fields=["status"])

        # Note: Sale remains OPEN - user can continue ordering or create new invoice

        return invoice
