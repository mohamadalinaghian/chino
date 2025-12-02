# apps/sale/tests/factories/transaction.py
"""
Factory for Transaction model.

Generates test data for base payment transactions with all payment types.
Follows the factory pattern used across the project.
"""

import factory
from apps.sale.models import Transaction
from django.utils import timezone


class TransactionFactory(factory.django.DjangoModelFactory):
    """
    Factory for creating Transaction instances.

    The Transaction model is the base for all payment types (POS, Cash, Card-to-Card).
    This factory creates verified transactions by default.
    """

    class Meta:
        model = Transaction

    invoice = factory.SubFactory("apps.sale.tests.factories.SaleInvoiceFactory")
    amount = factory.Faker(
        "pydecimal",
        left_digits=6,
        right_digits=4,
        positive=True,
        min_value=1000,
        max_value=500000,
    )
    payment_type = factory.Iterator(
        [
            Transaction.PaymentType.POS,
            Transaction.PaymentType.CASH,
            Transaction.PaymentType.CARD_TO_CARD,
        ]
    )
    payment_date = factory.LazyFunction(timezone.now)

    # Verification fields
    verified_by = factory.SubFactory(
        "apps.user.tests.factories.AccountFactory",
        is_staff=True,
    )
    is_verified = True
    verification_date = factory.LazyFunction(timezone.now)

    note = factory.Faker("sentence", nb_words=6)


class UnverifiedTransactionFactory(TransactionFactory):
    """
    Factory for unverified transactions.

    Useful for testing verification workflows.
    """

    is_verified = False
    verified_by = None
    verification_date = None
