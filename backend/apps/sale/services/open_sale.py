from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable, List, Optional

from apps.inventory.models import Product, Table
from apps.menu.models import Menu
from apps.menu.services.menu import MenuItemService
from apps.sale.models import Sale, SaleItem
from apps.sale.policies import can_open_sale
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import F, Sum
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class OpenSaleService:
    """
    Domain service for creating new sales transactions.

    Responsibilities:
        - Validates business rules (table required for dine-in, etc.)
        - Snapshots prices at time of sale
        - Creates sale header and line items atomically
        - Calculates and caches total amount

    Thread Safety: Safe (uses transaction.atomic)
    Database Calls: O(3) - 1 for sale, 1 for items, 1 for total update
    """

    # --- DTOs (Data Transfer Objects) ---
    @dataclass
    class ExtraInput:
        product: Product
        quantity: Decimal

    @dataclass
    class ItemInput:
        menu: Menu
        quantity: int
        extras: List[OpenSaleService.ExtraInput]

    @staticmethod
    @transaction.atomic
    def open_sale(
        *,
        opened_by: User,
        sale_type: Sale.SaleType,
        items: Iterable[ItemInput],
        table: Optional[Table] = None,
        guest_count: Optional[int] = None,
        guest=None,
        note: str = "",
    ) -> Sale:
        can_open_sale(opened_by)

        # Validation
        if not items:
            raise ValidationError(_("Sale must contain items"))
        if sale_type == Sale.SaleType.DINE_IN and not table:
            raise ValidationError(_("Table is required for dine-in sale"))
        if guest_count is not None and guest_count <= 0:
            raise ValidationError(_("Guest count must be positive"))

        # Create Header
        sale = Sale.objects.create(
            opened_by=opened_by,
            sale_type=sale_type,
            table=table,
            guest_count=guest_count,
            guest=guest,
            note=note,
            state=Sale.State.OPEN,
        )

        # Create Items
        for item in items:
            OpenSaleService.create_item_line(sale, item)

        # Totals
        OpenSaleService.recalculate_total(sale)
        return sale

    @staticmethod
    def create_item_line(sale: Sale, item: ItemInput) -> SaleItem:
        """
        Creates a parent SaleItem and its associated Extras.
        """
        if item.quantity <= 0:
            raise ValidationError(_("Item quantity must be positive"))
        if item.menu.price is None:
            raise ValidationError(_("Menu item has no price"))

        # Create Parent (Menu Item)
        # BUG FIX: Use item.menu.name (Product) for the FK
        parent = SaleItem.objects.create(
            sale=sale,
            product=item.menu.name,
            quantity=item.quantity,
            unit_price=Decimal(item.menu.price),
        )

        # Create Children (Extras)
        for extra in item.extras:
            OpenSaleService._create_extra_line(sale, parent, extra)

        return parent

    @staticmethod
    def _create_extra_line(sale: Sale, parent: SaleItem, extra: ExtraInput) -> SaleItem:
        if extra.quantity <= 0:
            raise ValidationError(_("Extra quantity must be positive"))

        # Calculate Price for Extra
        total_cost = Decimal(
            MenuItemService.extra_req_cost(
                product_id=extra.product.pk,
                quantity=extra.quantity,
            )
        )
        unit_price = total_cost / extra.quantity

        return SaleItem.objects.create(
            sale=sale,
            parent_item=parent,
            product=extra.product,
            quantity=extra.quantity,
            unit_price=unit_price,
        )

    @staticmethod
    def recalculate_total(sale: Sale) -> None:
        """
        Updates the cached total_amount using DB aggregation.
        """
        aggregation = sale.items.aggregate(
            total=Sum(
                F("quantity") * F("unit_price"), output_field=models.DecimalField()
            )
        )
        sale.total_amount = aggregation["total"] or Decimal("0")
        sale.save(update_fields=["total_amount", "updated_at"])
