# apps/sale/tests/factories/card_to_card_transaction.py
"""
Factory for CardToCardTransaction model.

Generates card-to-card transfer payment test data.
"""

import factory
from apps.sale.models import CardToCardTransaction, Transaction
from apps.sale.tests.factories.transaction import TransactionFactory


class CardToCardTransactionFactory(factory.django.DjangoModelFactory):
    """
    Factory for creating CardToCardTransaction instances.

    CardToCardTransaction requires:
    - A base Transaction with payment_type=CARD_TO_CARD
    - A destination bank account
    """

    class Meta:
        model = CardToCardTransaction

    transaction = factory.SubFactory(
        TransactionFactory,
        payment_type=Transaction.PaymentType.CARD_TO_CARD,
    )
    destination_account = factory.SubFactory(
        "apps.user.tests.factories.BankAccountFactory"
    )
