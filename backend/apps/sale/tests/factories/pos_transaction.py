# apps/sale/tests/factories/pos_transaction.py
"""
Factory for PosTransaction model.

Generates POS terminal payment test data with bank account references.
"""

import factory
from apps.sale.models import PosTransaction, Transaction
from apps.sale.tests.factories.transaction import TransactionFactory


class PosTransactionFactory(factory.django.DjangoModelFactory):
    """
    Factory for creating PosTransaction instances.

    PosTransaction requires:
    - A base Transaction with payment_type=POS
    - A target bank account
    """

    class Meta:
        model = PosTransaction

    transaction = factory.SubFactory(
        TransactionFactory,
        payment_type=Transaction.PaymentType.POS,
    )
    target_account = factory.SubFactory("apps.user.tests.factories.BankAccountFactory")
