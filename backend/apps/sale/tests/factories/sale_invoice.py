# apps/sale/tests/factories/sale_invoice.py
"""
Factory for SaleInvoice model.

Generates test data for sale invoices with various statuses and totals.
"""

from decimal import Decimal

import factory
from apps.sale.models import SaleInvoice
from django.utils import timezone


class SaleInvoiceFactory(factory.django.DjangoModelFactory):
    """
    Factory for creating SaleInvoice instances.

    Creates invoices with proper staff assignment and status tracking.
    Note: cached_total_amount and total_paid are usually calculated by services,
    but can be set manually for testing.
    """

    class Meta:
        model = SaleInvoice

    issue_date = factory.LazyFunction(timezone.now)
    staff = factory.SubFactory(
        "apps.user.tests.factories.AccountFactory",
        is_staff=True,
    )
    customer = factory.SubFactory(
        "apps.user.tests.factories.AccountFactory",
        is_staff=False,
    )
    bill_status = SaleInvoice.BillStatus.OPEN

    # These fields are typically calculated by SaleInvoiceService
    # but we provide defaults for direct factory usage
    cached_total_amount = factory.Faker(
        "pydecimal",
        left_digits=8,
        right_digits=4,
        positive=True,
        min_value=10000,
        max_value=1000000,
    )
    total_paid = Decimal("0")

    note = factory.Faker("text", max_nb_chars=128)


class PaidSaleInvoiceFactory(SaleInvoiceFactory):
    """
    Factory for fully paid invoices.

    Ensures total_paid equals cached_total_amount and status is PAID.
    """

    bill_status = SaleInvoice.BillStatus.PAID

    @factory.lazy_attribute
    def total_paid(self):
        """Set total_paid equal to cached_total_amount for paid invoices."""
        return self.cached_total_amount


class PartiallyPaidSaleInvoiceFactory(SaleInvoiceFactory):
    """
    Factory for partially paid invoices.

    Sets total_paid to 50% of cached_total_amount.
    """

    bill_status = SaleInvoice.BillStatus.PARTIALLY_PAID

    @factory.lazy_attribute
    def total_paid(self):
        """Set total_paid to 50% of total amount."""
        return self.cached_total_amount * Decimal("0.5")


class RefundedSaleInvoiceFactory(SaleInvoiceFactory):
    """Factory for refunded invoices."""

    bill_status = SaleInvoice.BillStatus.REFUNDED

    @factory.lazy_attribute
    def total_paid(self):
        """Refunded invoices were fully paid before refund."""
        return self.cached_total_amount
