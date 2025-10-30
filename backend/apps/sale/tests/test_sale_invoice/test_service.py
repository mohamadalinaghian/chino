from decimal import Decimal

import pytest
from apps.menu.tests.factories import MenuFactory
from apps.sale.models import (
    CardToCard,
    CashTransaction,
    PosTransaction,
    SaleInvoice,
    SaleItem,
)
from apps.sale.models.transaction import Transaction
from apps.sale.services.sale_invoice import SaleInvoiceService

# Factories
from apps.user.tests.factories import AccountFactory, BankAccountFactory
from django.core.exceptions import ValidationError
from django.db import transaction


@pytest.mark.django_db
class TestSaleInvoiceService:
    # ------------------------------------------------------------------
    # 1. Full payment already recorded (POS)
    # ------------------------------------------------------------------
    def test_close_invoice_with_full_payment_already_recorded(self):
        staff = AccountFactory(is_staff=True)
        bank_account = BankAccountFactory(account_owner=staff)  # ← Ensures exists
        customer = AccountFactory(is_staff=False)
        menu = MenuFactory(price=10000)

        invoice = SaleInvoice.objects.create(
            staff=staff,
            customer=customer,
            bill_status=SaleInvoice.BillStatus.OPEN,
        )
        SaleItem.objects.create(
            sale_invoice=invoice,
            product=menu.name,
            quantity=2,
            sold_unit_price=10000,
        )

        # Full POS payment
        PosTransaction.objects.create(
            invoice=invoice,
            amount=Decimal("20000"),
            target_account=bank_account,  # ← Use saved instance
        )

        SaleInvoiceService.close_invoice(invoice)
        invoice.refresh_from_db()
        assert invoice.bill_status == SaleInvoice.BillStatus.PAID

    # ------------------------------------------------------------------
    # 2. Final cash payment
    # ------------------------------------------------------------------
    def test_close_with_final_cash_payment(self):
        staff = AccountFactory(is_staff=True)
        customer = AccountFactory(is_staff=False)
        menu = MenuFactory(price=10000)

        invoice = SaleInvoice.objects.create(
            staff=staff,
            customer=customer,
            bill_status=SaleInvoice.BillStatus.OPEN,
        )
        SaleItem.objects.create(
            sale_invoice=invoice,
            product=menu.name,
            quantity=2,
            sold_unit_price=10000,
        )

        CashTransaction.objects.create(
            invoice=invoice,
            amount=Decimal("10000"),
            staff=staff,
        )

        SaleInvoiceService.close_invoice(
            invoice,
            final_payment=Decimal("10000"),
            payment_type=Transaction.PaymentType.CASH,
        )

        invoice.refresh_from_db()
        assert invoice.bill_status == SaleInvoice.BillStatus.PAID
        assert CashTransaction.objects.filter(invoice=invoice).count() == 2

    # ------------------------------------------------------------------
    # 3. Final POS payment
    # ------------------------------------------------------------------
    def test_close_with_final_pos_payment(self):
        staff = AccountFactory(is_staff=True)
        bank_account = BankAccountFactory(account_owner=staff)  # ← Saved
        customer = AccountFactory(is_staff=False)
        menu = MenuFactory(price=10000)

        invoice = SaleInvoice.objects.create(
            staff=staff,
            customer=customer,
            bill_status=SaleInvoice.BillStatus.OPEN,
        )
        SaleItem.objects.create(
            sale_invoice=invoice,
            product=menu.name,
            quantity=2,
            sold_unit_price=10000,
        )

        SaleInvoiceService.close_invoice(
            invoice,
            final_payment=Decimal("20000"),
            payment_type=Transaction.PaymentType.POS,
        )

        invoice.refresh_from_db()
        assert invoice.bill_status == SaleInvoice.BillStatus.PAID
        pos_tx = PosTransaction.objects.get(invoice=invoice)
        assert pos_tx.amount == Decimal("20000")
        assert pos_tx.target_account == bank_account

    # ------------------------------------------------------------------
    # 4. Final Card-to-Card
    # ------------------------------------------------------------------
    def test_close_with_final_card_to_card(self):
        staff = AccountFactory(is_staff=True)
        bank_account = BankAccountFactory(account_owner=staff)
        customer = AccountFactory(is_staff=False)
        menu = MenuFactory(price=10000)

        invoice = SaleInvoice.objects.create(
            staff=staff,
            customer=customer,
            bill_status=SaleInvoice.BillStatus.OPEN,
        )
        SaleItem.objects.create(
            sale_invoice=invoice,
            product=menu.name,
            quantity=2,
            sold_unit_price=10000,
        )

        SaleInvoiceService.close_invoice(
            invoice,
            final_payment=Decimal("20000"),
            payment_type=Transaction.PaymentType.CARD_TO_CARD,
        )

        invoice.refresh_from_db()
        assert invoice.bill_status == SaleInvoice.BillStatus.PAID
        card_tx = CardToCard.objects.get(invoice=invoice)
        assert card_tx.amount == Decimal("20000")
        assert card_tx.destination == bank_account

    # ------------------------------------------------------------------
    # 5. Invalid payment type
    # ------------------------------------------------------------------
    def test_invalid_payment_type_raises_error(self):
        invoice = SaleInvoice.objects.create(
            staff=AccountFactory(is_staff=True),
            customer=AccountFactory(is_staff=False),
            bill_status=SaleInvoice.BillStatus.OPEN,
        )

        with pytest.raises(ValidationError):
            SaleInvoiceService.close_invoice(
                invoice,
                final_payment=Decimal("10000"),
                payment_type="INVALID",
            )

    # ------------------------------------------------------------------
    # 6. Negative payment
    # ------------------------------------------------------------------
    def test_negative_final_payment_raises_error(self):
        invoice = SaleInvoice.objects.create(
            staff=AccountFactory(is_staff=True),
            customer=AccountFactory(is_staff=False),
            bill_status=SaleInvoice.BillStatus.OPEN,
        )

        with pytest.raises(ValidationError):
            SaleInvoiceService.close_invoice(
                invoice,
                final_payment=Decimal("-1000"),
                payment_type=Transaction.PaymentType.CASH,
            )

    # ------------------------------------------------------------------
    # 7. Shortfall
    # ------------------------------------------------------------------
    def test_shortfall_after_final_payment_raises_error(self):
        staff = AccountFactory(is_staff=True)
        customer = AccountFactory(is_staff=False)
        menu = MenuFactory(price=10000)

        invoice = SaleInvoice.objects.create(
            staff=staff,
            customer=customer,
            bill_status=SaleInvoice.BillStatus.OPEN,
        )
        SaleItem.objects.create(
            sale_invoice=invoice,
            product=menu.name,
            quantity=2,
            sold_unit_price=10000,
        )

        with pytest.raises(ValidationError) as exc:
            SaleInvoiceService.close_invoice(
                invoice,
                final_payment=Decimal("5000"),
                payment_type=Transaction.PaymentType.CASH,
            )
        assert "15000" in str(exc.value)

    # ------------------------------------------------------------------
    # 8. Already paid
    # ------------------------------------------------------------------
    def test_already_paid_invoice_does_nothing(self):
        invoice = SaleInvoice.objects.create(
            staff=AccountFactory(is_staff=True),
            customer=AccountFactory(is_staff=False),
            bill_status=SaleInvoice.BillStatus.PAID,
        )

        SaleInvoiceService.close_invoice(invoice)
        invoice.refresh_from_db()
        assert invoice.bill_status == SaleInvoice.BillStatus.PAID

    # ------------------------------------------------------------------
    # 9. Atomicity – rollback on failure
    # ------------------------------------------------------------------
    def test_atomicity_on_failure(self, monkeypatch):
        staff = AccountFactory(is_staff=True)
        customer = AccountFactory(is_staff=False)
        menu = MenuFactory(price=10000)

        invoice = SaleInvoice.objects.create(
            staff=staff,
            customer=customer,
            bill_status=SaleInvoice.BillStatus.OPEN,
        )
        SaleItem.objects.create(
            sale_invoice=invoice,
            product=menu.name,
            quantity=2,
            sold_unit_price=10000,
        )

        def fake_save(*args, **kwargs):
            raise Exception("DB boom")

        monkeypatch.setattr(SaleInvoice, "save", fake_save)

        with pytest.raises(Exception, match="DB boom"):
            with transaction.atomic():
                SaleInvoiceService.close_invoice(
                    invoice,
                    final_payment=Decimal("20000"),
                    payment_type=Transaction.PaymentType.CASH,
                )

        assert CashTransaction.objects.filter(invoice=invoice).count() == 0
        invoice.refresh_from_db()
        assert invoice.bill_status == SaleInvoice.BillStatus.OPEN
