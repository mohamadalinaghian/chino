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


@dataclass(frozen=True)
class PaymentInput:
    """
    DTO for creating a payment.

    IMPORTANT:
    - amount_applied settles ONLY sale.subtotal_amount
    - tax/discount are informational and derived at Sale level
    """

    method: str
    amount_applied: Decimal
    tax_amount: Decimal = Decimal("0")
    discount_amount: Decimal = Decimal("0")
    tip_amount: Decimal = Decimal("0")
    destination_account_id: Optional[int] = None


class PaymentService:
    """
    Authoritative payment service.

    Rules:
    - Payments are append-only
    - No item-level payment tracking
    - No tax/discount logic here
    - No auto-close here
    """

    @staticmethod
    @transaction.atomic
    def add_payments(
        *, sale: Sale, payments: List[PaymentInput], performer: User
    ) -> List[SalePayment]:
        if sale.state == Sale.SaleState.CANCELED:
            raise ValidationError(_("Cannot add payments to a canceled sale"))

        if not payments:
            raise ValidationError(_("At least one payment is required"))

        created: List[SalePayment] = []

        for input_data in payments:
            created.append(
                PaymentService._create_single_payment(
                    sale=sale,
                    input_data=input_data,
                    performer=performer,
                )
            )

        PaymentService._update_sale_payment_status(sale)
        return created

    # ------------------------------------------------------------------

    @staticmethod
    def _create_single_payment(
        *, sale: Sale, input_data: PaymentInput, performer: User
    ) -> SalePayment:
        # --- method validation ---
        if input_data.method not in dict(SalePayment.PaymentMethod.choices):
            raise ValidationError(_("Invalid payment method"))

        # --- amount validation ---
        if input_data.amount_applied <= 0:
            raise ValidationError(_("amount_applied must be positive"))

        if input_data.tax_amount < 0 or input_data.discount_amount < 0:
            raise ValidationError(_("Tax / discount cannot be negative"))

        if input_data.discount_amount > input_data.amount_applied:
            raise ValidationError(_("Discount cannot exceed applied amount"))

        # --- prevent subtotal overpayment ---
        sale.refresh_from_db()
        if input_data.amount_applied > sale.remaining_subtotal:
            raise ValidationError(
                _("Payment exceeds remaining subtotal (%(remaining)s)")
                % {"remaining": sale.remaining_subtotal}
            )

        # --- destination account rules ---
        destination_account = None
        if input_data.destination_account_id:
            try:
                destination_account = BankAccount.objects.get(
                    pk=input_data.destination_account_id
                )
            except BankAccount.DoesNotExist:
                raise ValidationError(_("Invalid destination account"))

        if input_data.method == SalePayment.PaymentMethod.CASH:
            if destination_account:
                raise ValidationError(_("Cash payment cannot have destination account"))
        else:
            if not destination_account:
                raise ValidationError(
                    _("Non-cash payments require destination account")
                )

        # --- create payment ---
        return SalePayment.objects.create(
            sale=sale,
            method=input_data.method,
            amount_applied=input_data.amount_applied,
            tax_amount=input_data.tax_amount,
            discount_amount=input_data.discount_amount,
            tip_amount=input_data.tip_amount,
            destination_account=destination_account,
            received_by=performer,
            status=SalePayment.PaymentStatus.COMPLETED,
        )

    # ------------------------------------------------------------------

    @staticmethod
    def _update_sale_payment_status(sale: Sale) -> None:
        sale.refresh_from_db()

        if sale.subtotal_paid >= sale.subtotal_amount:
            sale.payment_status = Sale.PaymentStatus.PAID
        elif sale.subtotal_paid > 0:
            sale.payment_status = Sale.PaymentStatus.PARTIALLY_PAID
        else:
            sale.payment_status = Sale.PaymentStatus.UNPAID

        sale.save(update_fields=["payment_status"])
