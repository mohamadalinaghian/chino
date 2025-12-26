from typing import Dict, List, Set

from api.schemas.sale_schemas import (
    ExtraDetailSchema,
    OpenSaleRequest,
    OpenSaleResponse,
    SaleDashboardItemSchema,
    SaleDashboardResponse,
    SaleDetailResponse,
    SaleItemDetailSchema,
    SyncSaleRequest,
)
from api.security.auth import jwt_auth
from apps.inventory.models import Product, Table
from apps.menu.models import Menu
from apps.sale.models import Sale, SaleItem
from apps.sale.policies import (
    can_close_sale,
    can_modify_sale,
    can_open_sale,
    can_see_sale_details,
    can_see_sale_list,
)
from apps.sale.services import CloseSaleService, ModifySaleService, OpenSaleService
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django_ratelimit.decorators import ratelimit
from ninja import Router

User = get_user_model()
router = Router(tags=["Sales"], auth=jwt_auth)


@router.post("/open", response=OpenSaleResponse)
@ratelimit(key="user", rate="2/m", method="POST")
def open_sale(request, payload: OpenSaleRequest):
    """
    Creates a new Sale in OPEN state.
    """
    can_open_sale(request.auth)

    # 1. Resolve Dependents
    guest = get_object_or_404(User, id=payload.guest_id) if payload.guest_id else None
    table = get_object_or_404(Table, id=payload.table_id) if payload.table_id else None

    # 2. OPTIMIZED PRE-FETCHING
    # Collect all Menu IDs
    menu_ids = {i.menu_id for i in payload.items}

    # Collect all Product IDs used in extras across ALL items
    extra_product_ids = {
        extra.product_id for item in payload.items for extra in item.extras
    }

    # Bulk Fetch (2 DB Queries total, regardless of item count)
    menus_map = {
        m.pk: m for m in Menu.objects.filter(id__in=menu_ids).select_related("name")
    }
    products_map = {p.pk: p for p in Product.objects.filter(id__in=extra_product_ids)}

    # 3. Validation & Mapping
    service_items = []

    for item in payload.items:
        # Validate Menu
        if item.menu_id not in menus_map:
            return 422, {"detail": f"Menu ID {item.menu_id} not found"}

        # Map Extras using the pre-fetched products_map
        extras = []
        for e in item.extras:
            if e.product_id not in products_map:
                return 422, {"detail": f"Product ID {e.product_id} not found"}

            extras.append(
                OpenSaleService.ExtraInput(
                    product=products_map[e.product_id], quantity=e.quantity
                )
            )

        # Build Item Input
        service_items.append(
            OpenSaleService.ItemInput(
                menu=menus_map[item.menu_id], quantity=item.quantity, extras=extras
            )
        )

    # 4. Execute Service
    try:
        sale = OpenSaleService.open_sale(
            opened_by=request.auth,
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

    can_modify_sale(request.auth, sale)

    try:
        # We pass the Schema directly. The Service handles the efficient
        # bulk fetching and mapping internally.
        updated_sale = ModifySaleService.sync_items(
            sale=sale, items_payload=payload.items, performer=request.auth
        )
    except ValidationError as e:
        return 422, {"detail": e.messages}

    return OpenSaleResponse(
        sale_id=updated_sale.pk,
        total_amount=updated_sale.total_amount,
        state=updated_sale.state,
    )


@router.get("/{sale_id}", response=SaleDetailResponse)
def get_sale_detail(request, sale_id: int):
    """
    Fetches the full structure of a Sale.
    - Resolves hierarchical relationships (Parents vs Extras).
    - Maps underlying Products back to Menu IDs for the UI.
    - Optimized to run in minimal DB queries (O(1)).
    """
    can_see_sale_details(request.auth)

    # 1. Fetch Sale with all necessary relations
    #    - select_related: Follows ForeignKeys (Single object)
    #    - prefetch_related: Follows Reverse Relations (Many objects)
    sale = get_object_or_404(
        Sale.objects.select_related("table", "guest").prefetch_related(
            "items",
            "items__product",  # Fetch product details for names/prices
        ),
        id=sale_id,
    )

    # 2. Separation of Concerns: Split Items into Parents and Children
    all_items: List[SaleItem] = list(sale.items.all())

    parents: List[SaleItem] = [i for i in all_items if i.parent_item_pk is None]
    children: List[SaleItem] = [i for i in all_items if i.parent_item_id is not None]

    # 3. Lookup Strategy: Map Products -> Menu IDs
    #    We collect all Product IDs from parent items to find which Menu they belong to.
    parent_product_ids: Set[int] = {p.product_id for p in parents}

    #    Fetch only the ID and Name_ID (Product FK) to keep query light.
    #    Logic: "Find Menus where the 'name' (Product) matches our items"
    menu_lookup_qs = Menu.objects.filter(name_id__in=parent_product_ids).values(
        "id", "name_id"
    )

    #    Create Dictionary: { product_id: menu_id }
    product_to_menu_map: Dict[int, int] = {
        entry["name_id"]: entry["id"] for entry in menu_lookup_qs
    }

    # 4. Construction: Build the Response Hierarchy
    response_items = []

    for parent in parents:
        # Find extras belonging to this specific parent
        my_extras = [
            ExtraDetailSchema(
                id=child.pk,
                product_id=child.product_id,
                product_name=child.product.name,
                quantity=child.quantity,
                unit_price=child.unit_price,
                total=child.quantity * child.unit_price,
            )
            for child in children
            if child.parent_item_id == parent.pk
        ]

        # Resolve the Menu ID
        linked_menu_id = product_to_menu_map.get(parent.product_id)

        response_items.append(
            SaleItemDetailSchema(
                id=parent.pk,
                menu_id=linked_menu_id,
                product_name=parent.product.name,
                quantity=parent.quantity,
                unit_price=parent.unit_price,
                total=parent.quantity * parent.unit_price,
                extras=my_extras,
            )
        )

    # 5. Return
    return {
        "id": sale.pk,
        "state": sale.state,
        "sale_type": sale.sale_type,
        "table_id": sale.table.id,
        "table_name": sale.table.name if sale.table else None,
        "guest_name": sale.guest.username if sale.guest else None,
        "guest_count": sale.guest_count,
        "total_amount": sale.total_amount,
        "note": sale.note,
        "opened_at": sale.opened_at,
        "items": response_items,
    }


@router.get("/", response=SaleDashboardResponse)
def sale_dashboard(request):
    """
    Operational Dashboard: Lists all currently OPEN sales.

    Performance:
    - O(1) Queries: Uses select_related to fetch Table and Staff info in 1 query.
    - Lightweight: Does NOT fetch line items (products/extras).
    """
    can_see_sale_list(request.auth)

    # 1. Base Query: Only Active (OPEN) sales
    #    We need Table info and the Staff member who opened it.
    qs = (
        Sale.objects.filter(state=Sale.State.OPEN)
        .select_related("table", "guest", "opened_by")
        .order_by("-opened_at")
    )  # Newest orders first

    # # 2. Aggregations (Optional, but very useful for Dashboards)
    # #    Calculates total pending revenue in database (faster than Python loop)
    # aggregates = qs.aggregate(total_rev=Sum("total_amount"))
    # total_revenue = aggregates["total_rev"] or Decimal("0.00")

    # only superuser can see total_amount
    can_see_total = request.auth.is_superuser
    # 3. Serialization
    #    We map the ORM objects to the lightweight Schema
    dashboard_items = [
        SaleDashboardItemSchema(
            id=sale.pk,
            table=sale.table.name if sale.table else None,
            guest_name=sale.guest.username if sale.guest else "Walk-in",
            total_amount=sale.total_amount if can_see_total else None,
            opened_by_name=sale.opened_by.get_full_name() or sale.opened_by.username,
            opened_at=sale.opened_at,
        )
        for sale in qs
    ]

    return SaleDashboardResponse(
        active_sales=dashboard_items,
        total_count=len(dashboard_items),
        # total_revenue_pending=total_revenue,
    )


@router.post("/{sale_id}/close", response=OpenSaleResponse)
def close_sale_endpoint(request, sale_id: int):
    """
    Closes the sale and marks it as paid.
    """

    sale = get_object_or_404(Sale, id=sale_id)

    #  Policy Check
    can_close_sale(request.auth, sale)

    try:
        closed_sale = CloseSaleService.close_sale(sale=sale, performer=request.auth)
    except ValidationError as e:
        return 422, {"detail": e.messages}

    return OpenSaleResponse(
        sale_id=closed_sale.pk,
        total_amount=closed_sale.total_amount,
        state=closed_sale.state,
    )
