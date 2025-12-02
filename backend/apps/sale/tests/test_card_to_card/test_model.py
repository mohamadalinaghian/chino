import pytest
from apps.sale.models import CardToCardTransaction, Transaction
from apps.sale.tests.factories import CardToCardTransactionFactory, SaleInvoiceFactory
from apps.user.tests.factories import AccountFactory, BankAccountFactory


@pytest.mark.django_db
class TestCardToCardTransactionModel:
    def setup_method(self):
        self.staff = AccountFactory(is_staff=True)
        self.invoice = SaleInvoiceFactory(staff=self.staff)
        self.destination_account = BankAccountFactory()

    def test_create_card_to_card_transaction_with_all_fields(self):
        card_transaction = CardToCardTransactionFactory(
            transaction__invoice=self.invoice,
            destination_account=self.destination_account,
        )

        assert card_transaction.transaction is not None
        assert card_transaction.destination_account == self.destination_account
        assert (
            card_transaction.transaction.payment_type
            == Transaction.PaymentType.CARD_TO_CARD
        )

    def test_card_to_card_transaction_one_to_one_with_transaction(self):
        card_transaction = CardToCardTransactionFactory(
            transaction__invoice=self.invoice,
            destination_account=self.destination_account,
        )

        base_transaction = card_transaction.transaction
        assert isinstance(base_transaction, Transaction)
        assert base_transaction.card_transfer_details == card_transaction

    def test_card_to_card_transaction_requires_destination_account(self):
        card_transaction = CardToCardTransactionFactory(
            transaction__invoice=self.invoice,
            destination_account=self.destination_account,
        )

        assert card_transaction.destination_account is not None

    def test_card_to_card_transaction_protect_bank_account(self):
        CardToCardTransactionFactory(
            transaction__invoice=self.invoice,
            destination_account=self.destination_account,
        )

        with pytest.raises(Exception):
            self.destination_account.delete()

        assert BankAccountFactory._meta.model.objects.filter(
            pk=self.destination_account.pk
        ).exists()

    def test_card_to_card_transaction_relationship_with_bank_account(self):
        card_transaction = CardToCardTransactionFactory(
            transaction__invoice=self.invoice,
            destination_account=self.destination_account,
        )

        assert card_transaction.destination_account == self.destination_account
        assert (
            card_transaction in self.destination_account.card_transfers_received.all()
        )

    def test_card_to_card_transaction_str_method(self):
        card_transaction = CardToCardTransactionFactory(
            transaction__invoice=self.invoice,
            destination_account=self.destination_account,
        )

        s = str(card_transaction)
        assert "Transfer" in s
        assert isinstance(s, str)

    def test_card_to_card_transaction_cascade_delete_with_transaction(self):
        card_transaction = CardToCardTransactionFactory(
            transaction__invoice=self.invoice,
            destination_account=self.destination_account,
        )

        transaction_pk = card_transaction.transaction.pk
        card_transaction.transaction.delete()

        assert not CardToCardTransaction.objects.filter(
            transaction_id=transaction_pk
        ).exists()

    def test_card_to_card_transaction_primary_key_is_transaction(self):
        card_transaction = CardToCardTransactionFactory(
            transaction__invoice=self.invoice,
            destination_account=self.destination_account,
        )

        assert card_transaction.pk == card_transaction.transaction.pk

    def test_multiple_card_transfers_to_same_account(self):
        invoice2 = SaleInvoiceFactory(staff=self.staff)

        trans1 = CardToCardTransactionFactory(
            transaction__invoice=self.invoice,
            destination_account=self.destination_account,
        )
        trans2 = CardToCardTransactionFactory(
            transaction__invoice=invoice2,
            destination_account=self.destination_account,
        )

        transfers = self.destination_account.card_transfers_received.all()
        assert transfers.count() == 2
        assert trans1 in transfers
        assert trans2 in transfers

    def test_card_to_card_transaction_verbose_name(self):
        assert CardToCardTransaction._meta.verbose_name == "Card to Card Transaction"
        assert (
            CardToCardTransaction._meta.verbose_name_plural
            == "Card to Card Transactions"
        )
