"""Service for modifying OPEN sales - syncing cart state with database."""

from typing import Any, Dict, List, Set

from apps.inventory.models import Product
from apps.menu.models import Menu
from apps.sale.models import Sale
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from ...policies import can_modify_sale
from .open_sale import OpenSaleService


class ModifySaleService:
    """
    Service for reconciling the Frontend 'Cart' state with the Backend Database.

    Implements 'Smart Sync' strategy:
    - Items with item_id → UPDATE quantity
    - Items without item_id → CREATE new
    - Items not in payload → DELETE (implicit)
    """

    @staticmethod
    @transaction.atomic
    def sync_items(*, sale: Sale, items_payload: List[Any], performer) -> Sale:
        """
        Sync sale items with frontend cart state.

        Args:
            sale: Sale instance (must be OPEN)
            items_payload: List of SyncSaleItemInput (item_id, menu_id, quantity, extras)
            performer: User making the modification

        Returns:
            Updated Sale instance

        Raises:
            ValidationError: If menu_id or product_id is invalid
        """
        # 1. Policy check
        can_modify_sale(performer, sale)

        if not items_payload:
            # Empty cart - delete all items
            sale.items.all().delete()
            sale.modified_by = performer
            OpenSaleService.recalculate_total(sale)
            return sale

        # 2. Bulk fetch all referenced entities (avoid N+1)
        menu_ids: Set[int] = {item.menu_id for item in items_payload}
        product_ids: Set[int] = {
            extra.product_id for item in items_payload for extra in item.extras
        }

        # Fetch and create lookup maps
        menus_map: Dict[int, Menu] = {
            m.pk: m for m in Menu.objects.filter(id__in=menu_ids).select_related("name")
        }
        products_map: Dict[int, Product] = {
            p.pk: p for p in Product.objects.filter(id__in=product_ids)
        }

        # Validate all IDs exist
        if len(menus_map) != len(menu_ids):
            missing = menu_ids - menus_map.keys()
            raise ValidationError(
                _("Invalid Menu IDs: %(ids)s") % {"ids": list(missing)}
            )

        if product_ids and len(products_map) != len(product_ids):
            missing = product_ids - products_map.keys()
            raise ValidationError(
                _("Invalid Product IDs: %(ids)s") % {"ids": list(missing)}
            )

        # 3. Detect deletions (items not in incoming payload)
        incoming_item_ids: Set[int] = {
            item.item_id for item in items_payload if item.item_id is not None
        }

        # Delete parent items (and their children via CASCADE) not in payload
        sale.items.filter(parent_item__isnull=True).exclude(
            id__in=incoming_item_ids
        ).delete()

        # 4. Process each item in payload
        for item_data in items_payload:
            if item_data.item_id:
                # CASE A: UPDATE EXISTING
                # Only update quantity - extras cannot be modified on existing items
                sale.items.filter(
                    id=item_data.item_id, sale=sale, parent_item__isnull=True
                ).update(quantity=item_data.quantity)

            else:
                # CASE B: CREATE NEW
                menu_obj = menus_map[item_data.menu_id]

                # Build extras DTOs
                extra_dtos = []
                for extra_data in item_data.extras:
                    extra_dtos.append(
                        OpenSaleService.ExtraInput(
                            product=products_map[extra_data.product_id],
                            quantity=extra_data.quantity,
                        )
                    )

                # Build item DTO
                item_dto = OpenSaleService.ItemInput(
                    menu=menu_obj, quantity=item_data.quantity, extras=extra_dtos
                )

                # Delegate to OpenSaleService for consistent creation logic
                OpenSaleService.create_item_line(sale, item_dto)

        # 5. Finalize: Update audit trail and recalculate totals
        sale.modified_by = performer
        OpenSaleService.recalculate_total(sale)

        return sale
