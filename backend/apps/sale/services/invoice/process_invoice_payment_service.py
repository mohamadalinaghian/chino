from decimal import Decimal
from typing import Optional

from apps.sale.models import Sale, SaleInvoice, SalePayment
from apps.sale.policies import can_issue_payment
from apps.sale.services.invoice.issue_payment_service import IssuePaymentService
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class ProcessInvoicePaymentService:
    """
    Process a payment against an invoice with automatic sale closure.

    This service:
    1. Records the payment using IssuePaymentService
    2. Checks if invoice is now fully paid
    3. If fully paid (PAID status), automatically closes the sale

    Payment Scenarios:
    - Full payment: Invoice PAID → Sale auto-closes (CLOSED)
    - Partial payment: Invoice PARTIALLY_PAID → Sale stays OPEN
    - Multiple payments: Last payment that reaches full amount → Sale auto-closes
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
    ) -> SalePayment:
        """
        Process a payment and potentially close the sale.

        Args:
            invoice: Invoice to apply payment to
            received_by: User receiving the payment
            method: Payment method (CASH, POS, CARD_TRANSFER)
            amount_applied: Amount applied to invoice balance
            tip_amount: Optional tip amount (default 0)
            destination_account: Bank account for POS/CARD_TRANSFER (required for those methods)

        Returns:
            SalePayment instance

        Raises:
            ValidationError: If payment validation fails
            PermissionDenied: If user lacks permission

        Side Effects:
            - If invoice becomes PAID, sale is automatically closed
        """
        # Check permission
        can_issue_payment(received_by, invoice)

        # Issue the payment (this updates invoice status)
        payment = IssuePaymentService.execute(
            invoice=invoice,
            received_by=received_by,
            method=method,
            amount_applied=amount_applied,
            tip_amount=tip_amount,
            destination_account=destination_account,
        )

        # Refresh invoice to get updated status
        invoice.refresh_from_db()

        # If invoice is fully paid, automatically close the sale
        if invoice.status == SaleInvoice.InvoiceStatus.PAID:
            cls._auto_close_sale(invoice.sale, received_by)

        return payment

    @staticmethod
    def _auto_close_sale(sale: Sale, closed_by) -> None:
        """
        Automatically close a sale when invoice is fully paid.

        Args:
            sale: Sale to close
            closed_by: User who processed the final payment
        """
        # Only close if sale is still OPEN
        if sale.state == Sale.State.OPEN:
            sale.state = Sale.State.CLOSED
            sale.closed_by = closed_by
            sale.closed_at = timezone.now()
            sale.save(update_fields=["state", "closed_by", "closed_at", "updated_at"])
