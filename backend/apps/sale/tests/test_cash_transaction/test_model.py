import pytest
from apps.sale.models import CashTransaction, Transaction
from apps.sale.tests.factories import CashTransactionFactory, SaleInvoiceFactory
from apps.user.tests.factories import AccountFactory


@pytest.mark.django_db
class TestCashTransactionModel:
    def setup_method(self):
        self.staff = AccountFactory(is_staff=True)
        self.invoice = SaleInvoiceFactory(staff=self.staff)

    def test_create_cash_transaction_with_all_fields(self):
        cash = CashTransactionFactory(
            transaction__invoice=self.invoice,
            cash_register_id="REG-001",
        )

        assert cash.transaction is not None
        assert cash.cash_register_id == "REG-001"
        assert cash.transaction.payment_type == Transaction.PaymentType.CASH

    def test_cash_transaction_one_to_one_with_transaction(self):
        cash = CashTransactionFactory(transaction__invoice=self.invoice)

        base_transaction = cash.transaction
        assert isinstance(base_transaction, Transaction)
        assert base_transaction.cash_details == cash

    def test_cash_transaction_register_id_optional(self):
        cash = CashTransactionFactory(
            transaction__invoice=self.invoice,
            cash_register_id="",
        )

        assert cash.cash_register_id == ""

    def test_cash_transaction_register_id_max_length(self):
        long_id = "A" * 20
        cash = CashTransactionFactory(
            transaction__invoice=self.invoice,
            cash_register_id=long_id,
        )

        assert len(cash.cash_register_id) == 20

    def test_cash_transaction_str_method(self):
        cash = CashTransactionFactory(transaction__invoice=self.invoice)

        s = str(cash)
        assert "Cash" in s
        assert isinstance(s, str)

    def test_cash_transaction_cascade_delete_with_transaction(self):
        cash = CashTransactionFactory(transaction__invoice=self.invoice)
        pk = cash.transaction.pk

        cash.transaction.delete()

        assert not CashTransaction.objects.filter(transaction_id=pk).exists()

    def test_cash_transaction_primary_key_is_transaction(self):
        cash = CashTransactionFactory(transaction__invoice=self.invoice)

        assert cash.pk == cash.transaction.pk

    def test_cash_transaction_verbose_name(self):
        assert CashTransaction._meta.verbose_name == "Cash Transaction"
        assert CashTransaction._meta.verbose_name_plural == "Cash Transactions"
