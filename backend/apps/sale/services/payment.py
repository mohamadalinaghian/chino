from __future__ import annotations

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from ...user.models import BankAccount
from ..models import (
    CardToCardTransaction,
    CashTransaction,
    PosTransaction,
    SaleInvoice,
    Transaction,
)
from .sale_invoice import SaleInvoiceService

UserModel = get_user_model()


class PaymentService:
    """
    Handle all payment operations:
    - Create transactions (POS/Cash/Card)
    - Verify payments
    - Update invoice status
    """

    # ========== PAYMENT CREATION ========== #

    @staticmethod
    @transaction.atomic
    def create_pos_payment(
        invoice: SaleInvoice,
        amount: Decimal,
        target_account: BankAccount,
        verified_by: UserModel,
    ) -> Transaction:
        """
        Create POS terminal payment.

        Args:
            invoice: Invoice being paid
            amount: Payment amount
            target_account: Bank account receiving funds
            verified_by: User verifying the payment

        Returns:
            Created Transaction with PosTransaction details

        Raises:
            ValidationError: If amount exceeds balance
        """
        # Validate amount
        PaymentService._validate_payment_amount(invoice, amount)

        # Create base transaction
        txn = Transaction.objects.create(
            invoice=invoice,
            amount=amount,
            payment_type=Transaction.PaymentType.POS,
            payment_date=timezone.now(),
            verified_by=verified_by,
        )

        # Create POS details
        PosTransaction.objects.create(
            transaction=txn,
            target_account=target_account,
        )

        # Update invoice totals and status
        PaymentService._update_invoice_after_payment(invoice)

        return txn

    @staticmethod
    @transaction.atomic
    def create_cash_payment(
        invoice: SaleInvoice,
        amount: Decimal,
        verified_by: UserModel,
        cash_register_id: str = "",
    ) -> Transaction:
        """Create cash payment"""
        PaymentService._validate_payment_amount(invoice, amount)

        txn = Transaction.objects.create(
            invoice=invoice,
            amount=amount,
            payment_type=Transaction.PaymentType.CASH,
            payment_date=timezone.now(),
            verified_by=verified_by,
        )

        CashTransaction.objects.create(
            transaction=txn,
            cash_register_id=cash_register_id,
        )

        PaymentService._update_invoice_after_payment(invoice)

        return txn

    @staticmethod
    @transaction.atomic
    def create_card_transfer(
        invoice: SaleInvoice,
        amount: Decimal,
        destination_account: BankAccount,
        verified_by: UserModel,
    ) -> Transaction:
        """Create card-to-card transfer payment"""
        PaymentService._validate_payment_amount(invoice, amount)

        txn = Transaction.objects.create(
            invoice=invoice,
            amount=amount,
            payment_type=Transaction.PaymentType.CARD_TO_CARD,
            payment_date=timezone.now(),
            verified_by=verified_by,
        )

        CardToCardTransaction.objects.create(
            transaction=txn,
            destination_account=destination_account,
        )

        PaymentService._update_invoice_after_payment(invoice)

        return txn

    # # ========== VERIFICATION ========== #
    #
    # @staticmethod
    # @transaction.atomic
    # def verify_transaction(
    #     transaction: Transaction,
    #     verified_by: UserModel,
    # ) -> None:
    #     """
    #     Mark transaction as verified by accounting.
    #
    #     Args:
    #         transaction: The transaction to verify
    #         verified_by: User performing verification
    #
    #     Raises:
    #         ValidationError: If already verified
    #     """
    #     if transaction.is_verified:
    #         raise ValidationError(_("Transaction already verified"))
    #
    #     transaction.is_verified = True
    #     transaction.verified_by = verified_by
    #     transaction.verification_date = timezone.now()
    #     transaction.save(
    #         update_fields=[
    #             "is_verified",
    #             "verified_by",
    #             "verification_date",
    #         ]
    #     )
    #
    #     # Update invoice totals (verified amount changed)
    #     PaymentService._update_invoice_after_payment(transaction.invoice)
    #
    # @staticmethod
    # @transaction.atomic
    # def unverify_transaction(
    #     transaction: Transaction,
    #     reason: str = "",
    # ) -> None:
    #     """
    #     Remove verification (e.g., if payment bounced).
    #
    #     Args:
    #         transaction: The transaction to unverify
    #         reason: Reason for unverification
    #     """
    #     if not transaction.is_verified:
    #         raise ValidationError(_("Transaction not verified"))
    #
    #     transaction.is_verified = False
    #     transaction.verified_by = None
    #     transaction.verification_date = None
    #     transaction.note += f"\n[UNVERIFIED: {reason}]"
    #     transaction.save(
    #         update_fields=[
    #             "is_verified",
    #             "verified_by",
    #             "verification_date",
    #             "note",
    #         ]
    #     )
    #
    #     # Update invoice status (might revert to PARTIAL)
    #     PaymentService._update_invoice_after_payment(transaction.invoice)

    # ========== SPLIT PAYMENT ========== #

    @staticmethod
    @transaction.atomic
    def split_payment(
        invoice: SaleInvoice,
        payments: list[dict],
        # [{type, amount, account, verified_by, ...}, ...]
    ) -> list[Transaction]:
        """
        Process multiple payment methods for one invoice.

        Example:
            split_payment(invoice, [
                {'type': 'CASH', 'amount': Decimal('50000'), 'verified_by': User1},
                {'type': 'POS', 'amount': Decimal('30000'), 'account': account, 'verified_by': User2},
            ])
        """
        # total_amount = sum(p["amount"] for p in payments)
        # balance = SaleInvoiceService.get_balance_due(invoice)

        # if total_amount > balance:
        #     raise ValidationError(
        #         _(f"Split payment total ({
        #           total_amount}) exceeds balance ({balance})")
        #     )

        transactions = []
        for payment in payments:
            payment_type = payment["type"]

            if payment_type == "CASH":
                txn = PaymentService.create_cash_payment(
                    invoice=invoice,
                    amount=payment["amount"],
                    cash_register_id=payment.get("register_id", ""),
                    verified_by=payment["verified_by"],
                )
            elif payment_type == "POS":
                txn = PaymentService.create_pos_payment(
                    invoice=invoice,
                    amount=payment["amount"],
                    target_account=payment["account"],
                    verified_by=payment["verified_by"],
                )
            elif payment_type == "CARD_TO_CARD":
                txn = PaymentService.create_card_transfer(
                    invoice=invoice,
                    amount=payment["amount"],
                    destination_account=payment["account"],
                    verified_by=payment["verified_by"],
                )
            else:
                raise ValidationError(_(f"Unknown payment type: {payment_type}"))

            transactions.append(txn)

        return transactions

    # ========== HELPERS ========== #

    @staticmethod
    def _validate_payment_amount(invoice: SaleInvoice, amount: Decimal) -> None:
        """Ensure payment amount is valid"""
        if amount <= 0:
            raise ValidationError(_("Payment amount must be positive"))

        # balance = SaleInvoiceService.get_balance_due(invoice)
        # if amount > balance:
        #     raise ValidationError(
        #         _(f"Payment ({amount}) exceeds balance due ({balance})")
        #     )

    @staticmethod
    def _update_invoice_after_payment(invoice: SaleInvoice) -> None:
        """Recalculate invoice totals and update status"""
        SaleInvoiceService.recalculate_totals(invoice)
        SaleInvoiceService.update_status_after_payment(invoice)

    # ========== QUERY HELPERS ========== #

    @staticmethod
    def get_daily_payment_summary(date):
        """Get payment breakdown by type for a specific date"""
        from django.db.models import Sum
        from django.utils import timezone

        start = timezone.datetime.combine(date, timezone.datetime.min.time())
        end = timezone.datetime.combine(date, timezone.datetime.max.time())

        summary = (
            Transaction.objects.filter(
                payment_date__range=(start, end),
                is_verified=True,
            )
            .values("payment_type")
            .annotate(total=Sum("amount"))
        )

        return {item["payment_type"]: item["total"] for item in summary}
