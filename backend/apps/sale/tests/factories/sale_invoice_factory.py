from decimal import Decimal

import factory
from apps.sale.models import SaleInvoice
from django.utils import timezone


class SaleInvoiceFactory(factory.django.DjangoModelFactory):
    """Factory for creating SaleInvoice test instances."""

    class Meta:
        model = SaleInvoice

    sale = factory.SubFactory("apps.sale.tests.factories.SaleFactory")
    invoice_number = factory.Sequence(lambda n: f"INV-{timezone.now().year}-{n:06d}")
    subtotal_amount = Decimal("100.0000")
    discount_amount = Decimal("0.0000")
    tax_amount = Decimal("9.0000")
    total_amount = Decimal("109.0000")
    status = SaleInvoice.InvoiceStatus.UNPAID
    issued_by = factory.SubFactory("apps.user.tests.factories.AccountFactory")
    issued_at = factory.LazyFunction(timezone.now)

    @factory.post_generation
    def with_payments(self, create, extracted, **kwargs):
        """Create payments for this invoice if requested."""
        if not create or not extracted:
            return

        from .sale_payment_factory import SalePaymentFactory

        if isinstance(extracted, int):
            # Create N payments
            for _ in range(extracted):
                SalePaymentFactory(invoice=self)
        elif isinstance(extracted, list):
            # Use provided payment configs
            for payment_config in extracted:
                SalePaymentFactory(invoice=self, **payment_config)
