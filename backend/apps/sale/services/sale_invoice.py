from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from ..models import (
    CardToCard,
    CashTransaction,
    PosTransaction,
    SaleInvoice,
    Transaction,
)

# Map PaymentType → concrete model
PAYMENT_MODEL_MAP = {
    Transaction.PaymentType.CASH: CashTransaction,
    Transaction.PaymentType.POS: PosTransaction,
    Transaction.PaymentType.CARD_TO_CARD: CardToCard,
}


class SaleInvoiceService:
    @staticmethod
    @transaction.atomic
    def close_invoice(
        invoice: SaleInvoice,
        *,
        final_payment: Decimal | None = None,
        payment_type: str | None = None,  # Must match PaymentType.choices
    ) -> None:
        """
        Close invoice if total_paid >= total_revenue.

        - If final_payment + payment_type → create correct transaction
        - If not → only validate existing payments
        """
        if invoice.bill_status == SaleInvoice.BillStatus.PAID:
            return

        total_revenue = invoice.total_revenue or Decimal("0")
        total_paid = invoice.total_paid

        # --- Optional final payment ---
        if final_payment is not None:
            if final_payment <= 0:
                raise ValidationError(_("Payment amount must be positive"))

            # Validate payment_type is a valid choice
            try:
                payment_choice = Transaction.PaymentType(payment_type)
            except ValueError:
                valid = ", ".join([f'"{c.value}"' for c in Transaction.PaymentType])
                raise ValidationError(
                    _("Invalid payment type. Must be one of: %(valid)s")
                    % {"valid": valid}
                )

            model = PAYMENT_MODEL_MAP[payment_choice]

            # Common fields
            create_kwargs = {
                "invoice": invoice,
                "amount": final_payment,
            }

            # Type-specific required fields
            if payment_choice == Transaction.PaymentType.CASH:
                create_kwargs["staff"] = invoice.staff

            elif payment_choice == Transaction.PaymentType.POS:
                target_account = invoice.staff.bank_accounts.first()
                if not target_account:
                    raise ValidationError(_("Staff has no bank account for POS"))
                create_kwargs["target_account"] = target_account

            elif payment_choice == Transaction.PaymentType.CARD_TO_CARD:
                destination = invoice.staff.bank_accounts.first()
                if not destination:
                    raise ValidationError(
                        _("Staff has no bank account for Card-to-Card")
                    )
                create_kwargs["destination"] = destination

            # Create the correct transaction
            model.objects.create(**create_kwargs)
            total_paid += final_payment

        # --- Final validation ---
        if total_paid >= total_revenue:
            invoice.bill_status = SaleInvoice.BillStatus.PAID
            invoice.save(update_fields=["bill_status"])
        else:
            shortfall = total_revenue - total_paid
            raise ValidationError(
                _("Cannot close: shortfall of %(amount)s") % {"amount": shortfall}
            )
