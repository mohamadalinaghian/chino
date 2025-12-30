from decimal import Decimal

import factory
from apps.sale.models import SaleRefund
from django.utils import timezone


class SaleRefundFactory(factory.django.DjangoModelFactory):
    """Factory for creating SaleRefund test instances."""

    class Meta:
        model = SaleRefund

    invoice = factory.SubFactory("apps.sale.tests.factories.SaleInvoiceFactory")
    payment = factory.SubFactory(
        "apps.sale.tests.factories.SalePaymentFactory",
        invoice=factory.SelfAttribute("..invoice"),
    )
    amount = Decimal("50.0000")
    method = SaleRefund.Method.CASH
    processed_by = factory.SubFactory("apps.user.tests.factories.AccountFactory")
    processed_at = factory.LazyFunction(timezone.now)
    reason = "Customer requested refund"
    status = SaleRefund.Status.COMPLETED
