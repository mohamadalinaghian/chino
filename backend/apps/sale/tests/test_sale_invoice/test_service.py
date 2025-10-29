from decimal import Decimal

import pytest
from apps.inventory.tests.factories import ProductFactory
from apps.menu.tests.factories import MenuFactory
from apps.sale.models import (
    CardToCard,
    CashTransaction,
    PosTransaction,
    SaleInvoice,
    SaleItem,
)
from apps.sale.models.transaction import Transaction
from apps.sale.services import SaleInvoiceService
from apps.user.tests.factories import AccountFactory, BankAccountFactory
from django.core.exceptions import ValidationError
from django.db import transaction


# ----------------------------------------------------------------------
# Fixtures
# ----------------------------------------------------------------------
@pytest.fixture
def staff_user():
    return AccountFactory(is_staff=True)


@pytest.fixture
def customer_user():
    return AccountFactory(is_staff=False)


@pytest.fixture
def sellable_product():
    return ProductFactory(type="SELLABLE")


@pytest.fixture
def menu_item(sellable_product, staff_user):
    return MenuFactory(name=sellable_product, price=10000)


@pytest.fixture
def open_invoice(staff_user, customer_user, menu_item):
    invoice = SaleInvoice.objects.create(
        staff=staff_user,
        customer=customer_user,
        bill_status=SaleInvoice.BillStatus.OPEN,
    )
    SaleItem.objects.create(
        sale_invoice=invoice,
        product=menu_item.name,
        quantity=Decimal("2"),
        sold_unit_price=Decimal("10000"),
    )
    return invoice


@pytest.fixture
def bank_account(staff_user):
    return BankAccountFactory(account_owner=staff_user)


# ----------------------------------------------------------------------
# Test Class
# ----------------------------------------------------------------------
@pytest.mark.django_db
class TestSaleInvoiceService:
    """Full test coverage of SaleInvoiceService using real models."""

    # ------------------------------------------------------------------
    # 1. Close with existing payments – happy path
    # ------------------------------------------------------------------
    def test_close_invoice_with_full_payment_already_recorded(self, open_invoice):
        # Add full payment via POS
        PosTransaction.objects.create(
            invoice=open_invoice,
            amount=Decimal("20000"),
            target_account=open_invoice.staff.bank_accounts.first(),
        )

        assert open_invoice.bill_status == SaleInvoice.BillStatus.OPEN
        assert open_invoice.total_paid == Decimal("20000")
        assert open_invoice.total_revenue == Decimal("20000")

        SaleInvoiceService.close_invoice(open_invoice)

        open_invoice.refresh_from_db()
        assert open_invoice.bill_status == SaleInvoice.BillStatus.PAID

    # ------------------------------------------------------------------
    # 2. Close with final cash payment
    # ------------------------------------------------------------------
    def test_close_with_final_cash_payment(self, open_invoice):
        # Partial payment
        CashTransaction.objects.create(
            invoice=open_invoice,
            amount=Decimal("10000"),
            staff=open_invoice.staff,
        )

        assert open_invoice.total_paid == Decimal("10000")

        SaleInvoiceService.close_invoice(
            open_invoice,
            final_payment=Decimal("10000"),
            payment_type=Transaction.PaymentType.CASH,
        )

        open_invoice.refresh_from_db()
        assert open_invoice.bill_status == SaleInvoice.BillStatus.PAID
        assert CashTransaction.objects.filter(invoice=open_invoice).count() == 2

    # ------------------------------------------------------------------
    # 3. Close with final POS payment
    # ------------------------------------------------------------------
    def test_close_with_final_pos_payment(self, open_invoice, bank_account):
        SaleInvoiceService.close_invoice(
            open_invoice,
            final_payment=Decimal("20000"),
            payment_type=Transaction.PaymentType.POS,
        )

        open_invoice.refresh_from_db()
        assert open_invoice.bill_status == SaleInvoice.BillStatus.PAID
        pos_tx = PosTransaction.objects.get(invoice=open_invoice)
        assert pos_tx.amount == Decimal("20000")
        assert pos_tx.target_account == bank_account

    # ------------------------------------------------------------------
    # 4. Close with final Card-to-Card
    # ------------------------------------------------------------------
    def test_close_with_final_card_to_card(self, open_invoice, bank_account):
        SaleInvoiceService.close_invoice(
            open_invoice,
            final_payment=Decimal("20000"),
            payment_type=Transaction.PaymentType.CARD_TO_CARD,
        )

        open_invoice.refresh_from_db()
        assert open_invoice.bill_status == SaleInvoice.BillStatus.PAID
        card_tx = CardToCard.objects.get(invoice=open_invoice)
        assert card_tx.amount == Decimal("20000")
        assert card_tx.destination == bank_account

    # ------------------------------------------------------------------
    # 5. Invalid payment type
    # ------------------------------------------------------------------
    def test_invalid_payment_type_raises_error(self, open_invoice):
        with pytest.raises(ValidationError) as exc:
            SaleInvoiceService.close_invoice(
                open_invoice,
                final_payment=Decimal("10000"),
                payment_type="INVALID",
            )
        assert "Invalid payment type" in str(exc.value)

    # ------------------------------------------------------------------
    # 6. Negative final payment
    # ------------------------------------------------------------------
    def test_negative_final_payment_raises_error(self, open_invoice):
        with pytest.raises(ValidationError) as exc:
            SaleInvoiceService.close_invoice(
                open_invoice,
                final_payment=Decimal("-1000"),
                payment_type=Transaction.PaymentType.CASH,
            )
        assert "must be positive" in str(exc.value)

    # ------------------------------------------------------------------
    # 7. No bank account for POS/Card-to-Card
    # ------------------------------------------------------------------
    def test_pos_without_bank_account_raises_error(self, open_invoice, staff_user):
        # Delete all bank accounts
        staff_user.bank_accounts.all().delete()

        with pytest.raises(ValidationError) as exc:
            SaleInvoiceService.close_invoice(
                open_invoice,
                final_payment=Decimal("20000"),
                payment_type=Transaction.PaymentType.POS,
            )
        assert "no bank account" in str(exc.value)

    # ------------------------------------------------------------------
    # 8. Shortfall after final payment
    # ------------------------------------------------------------------
    def test_shortfall_after_final_payment_raises_error(self, open_invoice):
        with pytest.raises(ValidationError) as exc:
            SaleInvoiceService.close_invoice(
                open_invoice,
                final_payment=Decimal("5000"),
                payment_type=Transaction.PaymentType.CASH,
            )
        assert "Shortfall" in str(exc.value)

    # ------------------------------------------------------------------
    # 9. Already paid invoice → no change
    # ------------------------------------------------------------------
    def test_already_paid_invoice_does_nothing(self, open_invoice):
        open_invoice.bill_status = SaleInvoice.BillStatus.PAID
        open_invoice.save()

        # Should not raise
        SaleInvoiceService.close_invoice(open_invoice)

        open_invoice.refresh_from_db()
        assert open_invoice.bill_status == SaleInvoice.BillStatus.PAID

    # ------------------------------------------------------------------
    # 10. Atomicity: partial failure rolls back
    # ------------------------------------------------------------------
    def test_atomicity_on_failure(self, open_invoice, mocker):
        # Mock to fail after creating transaction
        mocker.patch.object(
            SaleInvoice,
            "save",
            side_effect=Exception("DB boom"),
        )

        with pytest.raises(Exception, match="DB boom"):
            with transaction.atomic():
                SaleInvoiceService.close_invoice(
                    open_invoice,
                    final_payment=Decimal("20000"),
                    payment_type=Transaction.PaymentType.CASH,
                )

        # Transaction should NOT exist
        assert CashTransaction.objects.filter(invoice=open_invoice).count() == 0
        open_invoice.refresh_from_db()
        assert open_invoice.bill_status == SaleInvoice.BillStatus.OPEN
