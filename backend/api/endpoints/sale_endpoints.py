from api.schemas.sale_schemas import OpenSaleRequest, OpenSaleResponse, SyncSaleRequest
from api.security.auth import jwt_auth
from apps.inventory.models import Product, Table
from apps.menu.models import Menu
from apps.sale.models import Sale
from apps.sale.policies import can_modify_sale, can_open_sale
from apps.sale.services.modify_sale import ModifySaleService
from apps.sale.services.open_sale import OpenSaleService
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from ninja import Router

User = get_user_model()
router = Router(tags=["Sales"], auth=jwt_auth)


@router.post("/open", response=OpenSaleResponse)
def open_sale(request, payload: OpenSaleRequest):
    """
    Creates a new Sale in OPEN state.
    """
    can_open_sale(request.user)

    # 1. Resolve Dependents
    guest = get_object_or_404(User, id=payload.guest_id) if payload.guest_id else None
    table = get_object_or_404(Table, id=payload.table_id) if payload.table_id else None

    # 2. Map Items (One-by-one is okay here as it's a new sale, usually small)
    # Ideally, we could use the Bulk approach here too, but for clarity
    # we'll keep the standard mapping since OpenSaleService expects DTOs.
    service_items = []

    # Pre-fetch to optimize creation loop
    menu_ids = [i.menu_id for i in payload.items]
    menus = {m.pk: m for m in Menu.objects.filter(id__in=menu_ids)}

    for item in payload.items:
        if item.menu_id not in menus:
            return 422, {"detail": f"Menu ID {item.menu_id} not found"}

        extras = []
        for e in item.extras:
            # Note: Strict Senior code would bulk fetch products too.
            # Kept simple here for brevity, but ModifyService handles the bulk sync.
            prod = get_object_or_404(Product, id=e.product_id)
            extras.append(OpenSaleService.ExtraInput(product=prod, quantity=e.quantity))

        service_items.append(
            OpenSaleService.ItemInput(
                menu=menus[item.menu_id], quantity=item.quantity, extras=extras
            )
        )

    # 3. Execute
    try:
        sale = OpenSaleService.open_sale(
            opened_by=request.user,
            sale_type=Sale.SaleType(payload.sale_type),
            table=table,
            guest=guest,
            guest_count=payload.guest_count,
            note=payload.note or "",
            items=service_items,
        )
    except ValidationError as e:
        return 422, {"detail": e.messages}

    return OpenSaleResponse(
        sale_id=sale.pk, total_amount=sale.total_amount, state=sale.state
    )


@router.put("/{sale_id}/items", response=OpenSaleResponse)
def sync_sale_items(request, sale_id: int, payload: SyncSaleRequest):
    """
    Syncs the sale items. This is the only endpoint needed for
    Adding, Removing, or Editing items on an open sale.
    """

    sale = get_object_or_404(Sale, id=sale_id)

    can_modify_sale(request.user, sale)

    try:
        # We pass the Schema directly. The Service handles the efficient
        # bulk fetching and mapping internally.
        updated_sale = ModifySaleService.sync_items(
            sale=sale, items_payload=payload.items, performer=request.user
        )
    except ValidationError as e:
        return 422, {"detail": e.messages}

    return OpenSaleResponse(
        sale_id=updated_sale.pk,
        total_amount=updated_sale.total_amount,
        state=updated_sale.state,
    )
