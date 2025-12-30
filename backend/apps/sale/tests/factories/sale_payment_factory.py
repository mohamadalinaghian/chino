from decimal import Decimal

import factory
from apps.sale.models import SalePayment
from django.utils import timezone


class SalePaymentFactory(factory.django.DjangoModelFactory):
    """Factory for creating SalePayment test instances."""

    class Meta:
        model = SalePayment

    invoice = factory.SubFactory("apps.sale.tests.factories.SaleInvoiceFactory")
    method = SalePayment.PaymentMethod.CASH
    amount_total = Decimal("100.0000")
    amount_applied = Decimal("100.0000")
    tip_amount = Decimal("0.0000")
    destination_account = None
    received_by = factory.SubFactory("apps.user.tests.factories.AccountFactory")
    received_at = factory.LazyFunction(timezone.now)
    status = SalePayment.PaymentStatus.COMPLETED

    @factory.post_generation
    def with_tip(self, create, extracted, **kwargs):
        """Add tip amount if requested."""
        if not create or not extracted:
            return

        tip = Decimal(str(extracted))
        self.tip_amount = tip
        self.amount_total = self.amount_applied + tip
        self.save()

    @factory.post_generation
    def with_refunds(self, create, extracted, **kwargs):
        """Create refunds for this payment if requested."""
        if not create or not extracted:
            return

        from .sale_refund_factory import SaleRefundFactory

        if isinstance(extracted, int):
            # Create N refunds
            for _ in range(extracted):
                SaleRefundFactory(payment=self, invoice=self.invoice)
        elif isinstance(extracted, list):
            # Use provided refund configs
            for refund_config in extracted:
                SaleRefundFactory(
                    payment=self, invoice=self.invoice, **refund_config
                )
