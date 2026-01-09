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
        quantity: int

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

        # check for availability in stock
        # TODO: check for n+1 query and optimize them

        from apps.inventory.services import ItemProductionService
        from apps.inventory.services import StockService as SS

        for item in items:
            product = item.menu.name_id
            act_recipe = Product.objects.get(id=product).active_recipe
            com_rao = ItemProductionService._get_components_and_ratio(act_recipe)
            for p, r in com_rao:
                qt = item.quantity * r
                if not SS.is_enough(p, qt):
                    raise ValidationError(f"Not enough {p.name}")

            if item.extras:
                for i in item.extras:
                    if not SS.is_enough(i.product, Decimal(i.quantity)):
                        raise ValidationError(f"Not enough {i.product.name}")

        # Create Header
        sale = Sale.objects.create(
            opened_by=opened_by,
            sale_type=sale_type,
            table=table,
            guest_count=guest_count,
            guest=guest,
            note=note,
            state=Sale.SaleState.OPEN,
        )

        # Create Items
        for item in items:
            OpenSaleService.create_item_line(sale, item)

        # Totals
        OpenSaleService.recalculate_total(sale)

        # Print to thermal printer if requested
        # if print_order:

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
        parent = SaleItem.objects.create(
            sale=sale,
            product=item.menu.name,
            quantity=item.quantity,
            unit_price=item.menu.price,
            material_cost=item.menu.material_cost,
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
        total_price, total_cost = MenuItemService.extra_req_cost(
            product_id=extra.product.pk,
            quantity=Decimal(extra.quantity),
        )
        unit_price = total_price / extra.quantity

        return SaleItem.objects.create(
            sale=sale,
            parent_item=parent,
            product=extra.product,
            quantity=extra.quantity,
            unit_price=unit_price,
            material_cost=total_cost,
        )

    @staticmethod
    def recalculate_total(sale: Sale) -> None:
        """
        Updates the cached subtotal_amount using DB aggregation.
        The Sale model's save() method will auto-calculate total_amount, gross_profit, etc.
        """
        aggregation = sale.items.aggregate(
            total=Sum(
                F("quantity") * F("unit_price"), output_field=models.DecimalField()
            )
        )
        sale.subtotal_amount = aggregation["total"] or Decimal("0")
        # Save will auto-calculate: total_amount = subtotal - discount + tax
        # Skip validation since we're just recalculating totals
        sale.save(skip_validation=True)
