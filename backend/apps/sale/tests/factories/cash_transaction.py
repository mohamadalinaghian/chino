# apps/sale/tests/factories/cash_transaction.py
"""
Factory for CashTransaction model.

Generates cash payment test data with optional register tracking.
"""

import factory
from apps.sale.models import CashTransaction, Transaction
from apps.sale.tests.factories.transaction import TransactionFactory


class CashTransactionFactory(factory.django.DjangoModelFactory):
    """
    Factory for creating CashTransaction instances.

    CashTransaction requires:
    - A base Transaction with payment_type=CASH
    - Optional cash_register_id for tracking
    """

    class Meta:
        model = CashTransaction

    transaction = factory.SubFactory(
        TransactionFactory,
        payment_type=Transaction.PaymentType.CASH,
    )
    cash_register_id = factory.Sequence(lambda n: f"REG-{n:04d}")
