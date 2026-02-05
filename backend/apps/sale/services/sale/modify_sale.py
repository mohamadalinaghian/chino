"""
Service for modifying OPEN sales.
This is the ONLY place allowed to mutate sale items.
"""

from decimal import Decimal
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
    Reconciles frontend cart state with backend sale items.

    HARD RULE:
        new_subtotal_amount >= sale.subtotal_paid
    """

    @staticmethod
    @transaction.atomic
    def sync_items(*, sale: Sale, items_payload: List[Any], performer) -> Sale:
        # --------------------------------------------------
        # 1. Policy & state validation
        # --------------------------------------------------
        can_modify_sale(performer, sale)

        if sale.state != Sale.SaleState.OPEN:
            raise ValidationError(_("Only OPEN sales can be modified"))

        # --------------------------------------------------
        # 2. Handle empty cart explicitly
        # --------------------------------------------------
        if not items_payload:
            if sale.subtotal_paid > Decimal("0"):
                raise ValidationError(
                    _(
                        "Cannot remove all items after payments have been made "
                        "(paid: %(paid)s)"
                    )
                    % {"paid": sale.subtotal_paid}
                )

            sale.items.all().delete()
            sale.subtotal_amount = Decimal("0")
            sale.modified_by = performer
            sale.save(update_fields=["subtotal_amount", "modified_by"])
            return sale

        # --------------------------------------------------
        # 3. Bulk fetch referenced entities
        # --------------------------------------------------
        menu_ids: Set[int] = {item.menu_id for item in items_payload}
        product_ids: Set[int] = {
            extra.product_id for item in items_payload for extra in item.extras
        }

        menus_map: Dict[int, Menu] = {
            m.pk: m for m in Menu.objects.filter(pk__in=menu_ids)
        }
        products_map: Dict[int, Product] = {
            p.pk: p for p in Product.objects.filter(pk__in=product_ids)
        }

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

        # --------------------------------------------------
        # 4. Detect deletions
        # --------------------------------------------------
        incoming_item_ids: Set[int] = {
            item.item_id for item in items_payload if item.item_id is not None
        }

        sale.items.filter(parent_item__isnull=True).exclude(
            id__in=incoming_item_ids
        ).delete()

        # --------------------------------------------------
        # 5. Create / update items
        # --------------------------------------------------
        for item_data in items_payload:
            if item_data.item_id:
                # UPDATE quantity only
                sale.items.filter(
                    id=item_data.item_id,
                    sale=sale,
                    parent_item__isnull=True,
                ).update(quantity=item_data.quantity)

            else:
                # CREATE new item
                menu = menus_map[item_data.menu_id]

                extras = [
                    OpenSaleService.ExtraInput(
                        product=products_map[extra.product_id],
                        quantity=extra.quantity,
                    )
                    for extra in item_data.extras
                ]

                item_input = OpenSaleService.ItemInput(
                    menu=menu,
                    quantity=item_data.quantity,
                    extras=extras,
                )

                OpenSaleService.create_item_line(sale, item_input)

        # --------------------------------------------------
        # 6. Recalculate subtotal (AUTHORITATIVE)
        # --------------------------------------------------
        OpenSaleService.recalculate_subtotal(sale)
        sale.refresh_from_db()

        # --------------------------------------------------
        # 7. Enforce subtotal >= already paid
        # --------------------------------------------------
        if sale.subtotal_amount < sale.subtotal_paid:
            raise ValidationError(
                _(
                    "Cart subtotal (%(subtotal)s) cannot be lower than "
                    "already paid amount (%(paid)s)"
                )
                % {
                    "subtotal": sale.subtotal_amount,
                    "paid": sale.subtotal_paid,
                }
            )

        # --------------------------------------------------
        # 8. Finalize audit
        # --------------------------------------------------
        sale.modified_by = performer
        sale.save(update_fields=["subtotal_amount", "modified_by"])

        return sale
