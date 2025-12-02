import pytest
from apps.sale.models import PosTransaction, Transaction
from apps.sale.tests.factories import PosTransactionFactory, SaleInvoiceFactory
from apps.user.tests.factories import AccountFactory, BankAccountFactory


@pytest.mark.django_db
class TestPosTransactionModel:
    def setup_method(self):
        self.staff = AccountFactory(is_staff=True)
        self.invoice = SaleInvoiceFactory(staff=self.staff)
        self.bank_account = BankAccountFactory()

    def test_create_pos_transaction_with_all_fields(self):
        pos_transaction = PosTransactionFactory(
            transaction__invoice=self.invoice,
            target_account=self.bank_account,
        )

        assert pos_transaction.transaction is not None
        assert pos_transaction.target_account == self.bank_account
        assert pos_transaction.transaction.payment_type == Transaction.PaymentType.POS

    def test_pos_transaction_one_to_one_with_transaction(self):
        pos_transaction = PosTransactionFactory(
            transaction__invoice=self.invoice,
            target_account=self.bank_account,
        )

        base_transaction = pos_transaction.transaction
        assert isinstance(base_transaction, Transaction)
        assert base_transaction.pos_details == pos_transaction

    def test_pos_transaction_primary_key_is_transaction(self):
        pos_transaction = PosTransactionFactory(
            transaction__invoice=self.invoice,
            target_account=self.bank_account,
        )

        assert pos_transaction.pk == pos_transaction.transaction.pk

    def test_pos_transaction_requires_target_account(self):
        pos_transaction = PosTransactionFactory(
            transaction__invoice=self.invoice,
            target_account=self.bank_account,
        )
        assert pos_transaction.target_account is not None

    def test_pos_transaction_protect_bank_account(self):
        PosTransactionFactory(
            transaction__invoice=self.invoice,
            target_account=self.bank_account,
        )

        with pytest.raises(Exception):
            self.bank_account.delete()

        assert BankAccountFactory._meta.model.objects.filter(
            pk=self.bank_account.pk
        ).exists()

    def test_pos_transaction_relationship_with_bank_account(self):
        pos_transaction = PosTransactionFactory(
            transaction__invoice=self.invoice,
            target_account=self.bank_account,
        )

        assert pos_transaction.target_account == self.bank_account
        assert pos_transaction in self.bank_account.pos_transactions.all()

    def test_pos_transaction_str_method(self):
        pos_transaction = PosTransactionFactory(
            transaction__invoice=self.invoice,
            target_account=self.bank_account,
        )

        s = str(pos_transaction)
        assert "POS" in s
        assert isinstance(s, str)

    def test_pos_transaction_cascade_delete_with_transaction(self):
        pos_transaction = PosTransactionFactory(
            transaction__invoice=self.invoice,
            target_account=self.bank_account,
        )

        transaction_pk = pos_transaction.transaction.pk
        pos_transaction.transaction.delete()

        assert not PosTransaction.objects.filter(transaction_id=transaction_pk).exists()

    def test_multiple_pos_transactions_to_same_account(self):
        invoice2 = SaleInvoiceFactory(staff=self.staff)

        pos1 = PosTransactionFactory(
            transaction__invoice=self.invoice,
            target_account=self.bank_account,
        )
        pos2 = PosTransactionFactory(
            transaction__invoice=invoice2,
            target_account=self.bank_account,
        )

        qs = self.bank_account.pos_transactions.all()
        assert qs.count() == 2
        assert pos1 in qs
        assert pos2 in qs

    def test_pos_transaction_verbose_name(self):
        assert PosTransaction._meta.verbose_name == "POS Transaction"
        assert PosTransaction._meta.verbose_name_plural == "POS Transactions"

    def test_pos_transaction_only_one_per_base_transaction(self):
        pos_transaction = PosTransactionFactory(
            transaction__invoice=self.invoice,
            target_account=self.bank_account,
        )

        with pytest.raises(Exception):
            PosTransaction.objects.create(
                transaction=pos_transaction.transaction,
                target_account=self.bank_account,
            )
