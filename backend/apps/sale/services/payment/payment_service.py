"""Payment processing service for handling sale payments."""

from dataclasses import dataclass
from decimal import Decimal
from typing import List, Optional

from apps.sale.models import Sale, SaleItem, SalePayment
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


@dataclass
class TaxDiscountInput:
    """Data transfer object for tax/discount input."""

    type: str  # 'fixed' or 'percentage'
    value: Decimal


@dataclass
class EnhancedPaymentInput:
    """Enhanced payment input with item selection and tax/discount."""

    method: str  # SalePayment.PaymentMethod value
    amount_applied: Decimal
    tip_amount: Decimal = Decimal("0")
    destination_account_id: Optional[int] = None
    selected_item_ids: List[int] = None  # SaleItem IDs for partial payment
    tax: Optional[TaxDiscountInput] = None
    discount: Optional[TaxDiscountInput] = None


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

    @staticmethod
    @transaction.atomic
    def add_payments_to_sale(
        *,
        sale: Sale,
        payments: List[EnhancedPaymentInput],
        performer: User,
    ) -> tuple[Sale, List[SalePayment], bool]:
        """
        Add one or more payments to a sale (OPEN or CLOSED).
        Auto-closes the sale if total_paid >= total_amount.

        Args:
            sale: Sale instance (can be OPEN or CLOSED)
            payments: List of enhanced payment inputs
            performer: User processing the payments

        Returns:
            Tuple of (updated_sale, created_payments, was_auto_closed)

        Raises:
            ValidationError: If sale is CANCELED or payment data is invalid
        """
        if sale.state == Sale.SaleState.CANCELED:
            raise ValidationError(_("Cannot add payments to a CANCELED sale"))

        if not payments:
            raise ValidationError(_("At least one payment is required"))

        created_payments = []

        for payment_input in payments:
            payment = PaymentService._create_enhanced_payment(
                sale=sale, payment_input=payment_input, performer=performer
            )
            created_payments.append(payment)

        # Update sale payment status
        PaymentService._update_sale_payment_status(sale)

        # Auto-close if fully paid
        was_auto_closed = False
        sale.refresh_from_db()
        if sale.state == Sale.SaleState.OPEN and sale.is_fully_paid:
            # Import here to avoid circular imports
            from apps.sale.services.sale.close_sale import CloseSaleService

            # Close without additional payments (already processed above)
            sale, _ = CloseSaleService.finalize_and_pay(
                sale=sale,
                performer=performer,
                tax_amount=sale.tax_amount,
                discount_amount=sale.discount_amount,
                payments=[],  # No additional payments
            )
            was_auto_closed = True

        return sale, created_payments, was_auto_closed

    @staticmethod
    def _create_enhanced_payment(
        *, sale: Sale, payment_input: EnhancedPaymentInput, performer: User
    ) -> SalePayment:
        """
        Create a payment with item selection and tax/discount support.

        Args:
            sale: Sale instance
            payment_input: Enhanced payment data
            performer: User creating the payment

        Returns:
            Created SalePayment instance

        Raises:
            ValidationError: If payment data is invalid
        """
        # Validate payment method
        if payment_input.method not in dict(SalePayment.PaymentMethod.choices):
            raise ValidationError(
                _("Invalid payment method: %(method)s")
                % {"method": payment_input.method}
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

        # Validate selected items if specified
        selected_items = []
        if payment_input.selected_item_ids:
            selected_items = list(
                SaleItem.objects.filter(
                    id__in=payment_input.selected_item_ids, sale=sale
                )
            )
            if len(selected_items) != len(payment_input.selected_item_ids):
                raise ValidationError(
                    _("Some selected items do not belong to this sale")
                )

        # Calculate tax and discount based on selected items
        tax_amount = Decimal("0")
        discount_amount = Decimal("0")

        if payment_input.tax:
            tax_amount = PaymentService._calculate_tax_discount(
                payment_input.tax, sale, selected_items
            )

        if payment_input.discount:
            discount_amount = PaymentService._calculate_tax_discount(
                payment_input.discount, sale, selected_items
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

        # Link selected items if specified
        if selected_items:
            payment.sale_items.set(selected_items)

        return payment

    @staticmethod
    def _calculate_tax_discount(
        input_data: TaxDiscountInput, sale: Sale, selected_items: List[SaleItem]
    ) -> Decimal:
        """
        Calculate tax or discount amount based on type (fixed or percentage).

        Args:
            input_data: Tax or discount input
            sale: Sale instance
            selected_items: List of selected items (empty = all items)

        Returns:
            Calculated amount

        Raises:
            ValidationError: If input type is invalid
        """
        if input_data.type == "fixed":
            return input_data.value
        elif input_data.type == "percentage":
            # Calculate base amount from selected items or all items
            if selected_items:
                base_amount = sum(
                    item.quantity * item.unit_price for item in selected_items
                )
            else:
                base_amount = sale.subtotal_amount

            return (base_amount * input_data.value / Decimal("100")).quantize(
                Decimal("0.01")
            )
        else:
            raise ValidationError(
                _("Invalid tax/discount type: %(type)s. Must be 'fixed' or 'percentage'")
                % {"type": input_data.type}
            )
