from typing import Dict, List

# We import the Schema strictly for type hinting the input structure
from api.schemas.sale_schemas import SyncSaleItemInput
from apps.inventory.models import Product
from apps.menu.models import Menu
from apps.sale.models import Sale
from apps.sale.services.sale.open_sale import OpenSaleService
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from ...policies import can_modify_sale


class ModifySaleService:
    """
    Service for reconciling the Frontend 'Cart' state
        with the Backend Database.
    Implements the 'Smart Sync' strategy.
    """

    @staticmethod
    @transaction.atomic
    def sync_items(
        *, sale: Sale, items_payload: List[SyncSaleItemInput], performer
    ) -> Sale:
        # 1. Validation
        can_modify_sale(performer, sale)

        # 2. Bulk Fetching (Avoid N+1)
        # We need all Menus and Products referenced
        #   in the payload to create objects fast.
        menu_ids = {item.menu_id for item in items_payload}
        product_ids = set()
        for item in items_payload:
            for extra in item.extras:
                product_ids.add(extra.product_id)

        # Create lookup dictionaries
        menus_map: Dict[int, Menu] = {
            m.pk: m for m in Menu.objects.filter(id__in=menu_ids)
        }
        products_map: Dict[int, Product] = {
            p.pk: p for p in Product.objects.filter(id__in=product_ids)
        }

        # Verify all IDs exist (Data integrity check)
        if len(menus_map) != len(menu_ids):
            raise ValidationError(_("One or more Menu IDs are invalid"))

        # 3. Detect Deletes (Implicit)
        incoming_ids = {
            item.item_id for item in items_payload if item.item_id is not None
        }
        # Delete items belonging to this sale that are NOT in the incoming list
        sale.items.exclude(id__in=incoming_ids).delete()

        # 4. Iterate and Sync
        for item_data in items_payload:
            # --- CASE A: UPDATE EXISTING ---
            if item_data.item_id:
                # We trust the ID exists because we filtered in Step 3.
                # However, for security, ensure the ID actually belongs to *this* sale.
                sale.items.filter(id=item_data.item_id).update(
                    quantity=item_data.quantity
                )
                # Note: We do NOT update extras for existing items in this simple sync.
                # If staff wants to change extras, the frontend usually sends it as a new line.

            # --- CASE B: CREATE NEW ---
            else:
                # Build the Domain DTO
                menu_obj = menus_map[item_data.menu_id]

                extra_dtos = []
                for extra_data in item_data.extras:
                    if extra_data.product_id not in products_map:
                        raise ValidationError(
                            f"Invalid Product ID: {extra_data.product_id}"
                        )

                    extra_dtos.append(
                        OpenSaleService.ExtraInput(
                            product=products_map[extra_data.product_id],
                            quantity=extra_data.quantity,
                        )
                    )

                item_dto = OpenSaleService.ItemInput(
                    menu=menu_obj, quantity=item_data.quantity, extras=extra_dtos
                )

                # Delegate creation logic to OpenSaleService
                OpenSaleService.create_item_line(sale, item_dto)

        # 5. Finalize
        sale.last_modified_by = performer
        OpenSaleService.recalculate_total(sale)

        return sale
