"""Payment processing service for handling sale payments."""

from dataclasses import dataclass
from decimal import Decimal
from typing import List, Optional

from apps.sale.models import Sale, SalePayment
from apps.user.models import BankAccount
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

User = get_user_model()


@dataclass
class PaymentInput:
    """Data transfer object for payment input."""

    method: str  # SalePayment.PaymentMethod value
    amount_applied: Decimal
    tip_amount: Decimal = Decimal("0")
    destination_account_id: Optional[int] = None


class PaymentService:
    """
    Service for processing payments on sales.

    Responsibilities:
        - Validate payment data
        - Create payment records
        - Update sale payment status
        - Handle payment method-specific logic
    """

    @staticmethod
    @transaction.atomic
    def process_payments(
        *, sale: Sale, payments: List[PaymentInput], performer: User
    ) -> List[SalePayment]:
        """
        Process multiple payments for a sale.

        Args:
            sale: Sale instance (must be CLOSED state)
            payments: List of payment inputs
            performer: User processing the payments

        Returns:
            List of created SalePayment instances

        Raises:
            ValidationError: If sale state is invalid or payment data is invalid
        """
        if sale.state != Sale.SaleState.CLOSED:
            raise ValidationError(
                _("Payments can only be processed for CLOSED sales")
            )

        if not payments:
            raise ValidationError(_("At least one payment is required"))

        created_payments = []

        for payment_input in payments:
            payment = PaymentService._create_payment(
                sale=sale, payment_input=payment_input, performer=performer
            )
            created_payments.append(payment)

        # Update sale payment status based on total paid
        PaymentService._update_sale_payment_status(sale)

        return created_payments

    @staticmethod
    def _create_payment(
        *, sale: Sale, payment_input: PaymentInput, performer: User
    ) -> SalePayment:
        """
        Create a single payment record.

        Args:
            sale: Sale instance
            payment_input: Payment data
            performer: User creating the payment

        Returns:
            Created SalePayment instance

        Raises:
            ValidationError: If payment data is invalid
        """
        # Validate payment method
        if payment_input.method not in dict(SalePayment.PaymentMethod.choices):
            raise ValidationError(
                _("Invalid payment method: %(method)s") % {"method": payment_input.method}
            )

        # Validate amounts
        if payment_input.amount_applied <= 0:
            raise ValidationError(_("Payment amount must be positive"))

        if payment_input.tip_amount < 0:
            raise ValidationError(_("Tip amount cannot be negative"))

        # Get destination account if specified
        destination_account = None
        if payment_input.destination_account_id:
            try:
                destination_account = BankAccount.objects.get(
                    pk=payment_input.destination_account_id
                )
            except BankAccount.DoesNotExist:
                raise ValidationError(
                    _("Invalid destination account ID: %(id)s")
                    % {"id": payment_input.destination_account_id}
                )

        # Validate destination account rules
        if payment_input.method == SalePayment.PaymentMethod.CASH:
            if destination_account:
                raise ValidationError(
                    _("Cash payments must not have destination account")
                )
        elif payment_input.method in {
            SalePayment.PaymentMethod.POS,
            SalePayment.PaymentMethod.CARD_TRANSFER,
        }:
            if not destination_account:
                raise ValidationError(
                    _("%(method)s requires a destination account")
                    % {"method": payment_input.method}
                )

        # Calculate total
        amount_total = payment_input.amount_applied + payment_input.tip_amount

        # Create payment
        payment = SalePayment.objects.create(
            sale=sale,
            method=payment_input.method,
            amount_total=amount_total,
            amount_applied=payment_input.amount_applied,
            tip_amount=payment_input.tip_amount,
            destination_account=destination_account,
            received_by=performer,
            status=SalePayment.PaymentStatus.COMPLETED,
        )

        return payment

    @staticmethod
    def _update_sale_payment_status(sale: Sale) -> None:
        """
        Update sale payment status based on total payments.

        Args:
            sale: Sale instance to update
        """
        sale.refresh_from_db()

        if sale.is_fully_paid:
            sale.payment_status = Sale.PaymentStatus.PAID
        elif sale.total_paid > 0:
            sale.payment_status = Sale.PaymentStatus.PARTIALLY_PAID
        else:
            sale.payment_status = Sale.PaymentStatus.UNPAID

        sale.save(skip_validation=True)
