from decimal import Decimal

import pytest
from apps.inventory.tests.factories import ProductFactory, TableFactory
from apps.menu.tests.factories import MenuFactory
from apps.sale.models import Sale
from apps.sale.services.sale.open_sale import OpenSaleService
from apps.user.tests.factories import AccountFactory
from django.contrib.auth.models import Permission


@pytest.mark.django_db
class TestOpenSaleService:
    """
    Tests for opening a sale.
    """

    def setup_method(self):
        self.cashier = AccountFactory(is_staff=True)
        self.waiter = AccountFactory(is_staff=True)

        self.cashier.user_permissions.add(Permission.objects.get(codename="open_sale"))

        self.table = TableFactory()
        self.menu = MenuFactory(price=100)
        self.extra_product = ProductFactory()

    # ---------- HAPPY PATH ----------

    def test_open_dine_in_sale_with_extra(self):
        items = [
            OpenSaleService.ItemInput(
                menu=self.menu,
                quantity=2,
                extras=[
                    OpenSaleService.ExtraInput(
                        product=self.extra_product,
                        quantity=Decimal("1"),
                    )
                ],
            )
        ]

        sale = OpenSaleService.open_sale(
            opened_by=self.cashier,
            sale_type=Sale.SaleType.DINE_IN,
            table=self.table,
            guest_count=2,
            items=items,
        )

        assert sale.state == Sale.State.OPEN
        assert sale.sale_type == Sale.SaleType.DINE_IN
        assert sale.items.count() == 2

        parent = sale.items.get(parent_item__isnull=True)
        extra = sale.items.get(parent_item=parent)

        assert parent.quantity == Decimal("2")
        assert parent.unit_price == Decimal("100")
        assert extra.parent_item == parent

    # ---------- VALIDATIONS ----------

    def test_dine_in_requires_table(self):
        items = [
            OpenSaleService.ItemInput(
                menu=self.menu,
                quantity=Decimal("1"),
            )
        ]

        with pytest.raises(Exception):
            OpenSaleService.open_sale(
                opened_by=self.cashier,
                sale_type=Sale.SaleType.DINE_IN,
                items=items,
            )

    def test_sale_requires_items(self):
        with pytest.raises(Exception):
            OpenSaleService.open_sale(
                opened_by=self.cashier,
                sale_type=Sale.SaleType.TAKEAWAY,
                items=[],
            )

    def test_user_without_permission_cannot_open_sale(self):
        items = [
            OpenSaleService.ItemInput(
                menu=self.menu,
                quantity=Decimal("1"),
            )
        ]

        with pytest.raises(Exception):
            OpenSaleService.open_sale(
                opened_by=self.waiter,
                sale_type=Sale.SaleType.TAKEAWAY,
                items=items,
            )

    # ---------- TOTAL ----------

    def test_total_amount_calculation(self):
        items = [
            OpenSaleService.ItemInput(menu=self.menu, quantity=Decimal("2")),
            OpenSaleService.ItemInput(menu=self.menu, quantity=Decimal("1")),
        ]

        sale = OpenSaleService.open_sale(
            opened_by=self.cashier,
            sale_type=Sale.SaleType.TAKEAWAY,
            items=items,
        )

        assert sale.total_amount == Decimal("300")
