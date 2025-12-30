import pytest
from apps.sale.models import Sale
from apps.sale.services.sale.close_sale import CloseSaleService
from apps.sale.tests.factories import SaleFactory, SaleItemFactory
from apps.user.tests.factories import AccountFactory
from django.contrib.auth.models import Permission
from django.utils import timezone


@pytest.mark.django_db
class TestCloseSaleService:
    """
    Tests for closing a sale.
    """

    def setup_method(self):
        self.cashier = AccountFactory(is_staff=True)
        self.waiter = AccountFactory(is_staff=True)
        self.cashier.user_permissions.add(Permission.objects.get(codename="close_sale"))

    # ---------- HAPPY PATH ----------

    def test_close_open_sale_successfully(self):
        sale = SaleFactory(state=Sale.State.OPEN)
        SaleItemFactory(sale=sale)

        closed_sale = CloseSaleService.close_sale(
            sale=sale,
            performer=self.cashier,
        )

        assert closed_sale.state == Sale.State.CLOSED
        assert closed_sale.closed_at is not None
        assert closed_sale.closed_at <= timezone.now()

    # ---------- VALIDATION ----------

    def test_cannot_close_sale_without_permission(self):
        sale = SaleFactory(state=Sale.State.OPEN)
        SaleItemFactory(sale=sale)

        with pytest.raises(Exception):
            CloseSaleService.close_sale(
                sale=sale,
                performer=self.waiter,
            )

    def test_cannot_close_non_open_sale(self):
        sale = SaleFactory(state=Sale.State.CLOSED)
        SaleItemFactory(sale=sale)

        with pytest.raises(Exception):
            CloseSaleService.close_sale(
                sale=sale,
                performer=self.cashier,
            )

    def test_cannot_close_empty_sale(self):
        sale = SaleFactory(state=Sale.State.OPEN)

        with pytest.raises(Exception):
            CloseSaleService.close_sale(
                sale=sale,
                performer=self.cashier,
            )
