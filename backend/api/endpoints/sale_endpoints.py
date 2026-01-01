from typing import Dict, List, Set

from api.schemas.sale_schemas import (
    CancelSaleRequest,
    CancelSaleResponse,
    CloseSaleRequest,
    CloseSaleResponse,
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
    can_cancel_close_sale,
    can_close_sale,
    can_modify_sale,
    can_open_sale,
    can_see_sale_details,
    can_see_sale_list,
)
from apps.sale.services.sale.cancel_sale import CancelSaleService
from apps.sale.services.sale.close_sale import CloseSaleService
from apps.sale.services.sale.modify_sale import ModifySaleService
from apps.sale.services.sale.open_sale import OpenSaleService
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


@router.post("/{sale_id}/sync", response=OpenSaleResponse)
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
        Sale.objects.select_related(
            "table",
            "guest",
            "opened_by",
            "modified_by",
            "closed_by",
            "canceled_by",
        ).prefetch_related(
            "items",
            "items__product",  # Fetch product details for names/prices
        ),
        id=sale_id,
    )

    # 2. Separation of Concerns: Split Items into Parents and Children
    all_items: List[SaleItem] = list(sale.items.all())

    parents: List[SaleItem] = [i for i in all_items if i.parent_item_id is None]
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
                product_id=child.product.id,
                product_name=child.product.name,
                quantity=child.quantity,
                unit_price=child.unit_price,
                total=child.quantity * child.unit_price,
            )
            for child in children
            if child.parent_item.id == parent.pk
        ]

        # Resolve the Menu ID
        linked_menu_id = product_to_menu_map.get(parent.product.id)

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

    # 5. Check permissions for revenue data
    can_view_revenue = request.auth.has_perm("sale.view_revenue_data")

    # 6. Build response with conditional COGS data
    response_data = {
        # ---- Sale Metadata ----
        "id": sale.pk,
        "state": sale.state,
        "sale_type": sale.sale_type,
        "table_id": sale.table.id if sale.table else None,
        "table_name": sale.table.name if sale.table else None,
        "guest_name": (
            sale.guest.get_full_name() or sale.guest.username if sale.guest else None
        ),
        "guest_count": sale.guest_count,
        "note": sale.note,
        "opened_at": sale.opened_at,
        "opened_by_name": sale.opened_by.get_full_name() or sale.opened_by.username,
        "modified_by_name": (
            sale.modified_by.get_full_name() or sale.modified_by.username
            if sale.modified_by
            else None
        ),
        # ---- Financial Data ----
        "subtotal_amount": sale.subtotal_amount,
        "discount_amount": sale.discount_amount,
        "tax_amount": sale.tax_amount,
        "total_amount": sale.total_amount,
        # ---- Invoice Data (when CLOSED) ----
        "payment_status": sale.payment_status if sale.is_closed else None,
        "closed_at": sale.closed_at,
        "closed_by_name": (
            sale.closed_by.get_full_name() or sale.closed_by.username
            if sale.closed_by
            else None
        ),
        "close_reason": sale.close_reason,
        # ---- Payment Tracking (when CLOSED) ----
        "total_paid": sale.total_paid if sale.is_closed else None,
        "balance_due": sale.balance_due if sale.is_closed else None,
        "is_fully_paid": sale.is_fully_paid if sale.is_closed else None,
        # ---- COGS & Revenue (only if has permission) ----
        "total_cost": sale.total_cost if can_view_revenue else None,
        "gross_profit": sale.gross_profit if can_view_revenue else None,
        "gross_margin_percent": sale.gross_margin_percent if can_view_revenue else None,
        # ---- Cancellation (when CANCELED) ----
        "canceled_at": sale.canceled_at,
        "canceled_by_name": (
            sale.canceled_by.get_full_name() or sale.canceled_by.username
            if sale.canceled_by
            else None
        ),
        "cancel_reason": sale.cancel_reason,
        # ---- Items ----
        "items": response_items,
    }

    return response_data


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
        Sale.objects.filter(state=Sale.SaleState.OPEN)
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
            state=sale.state,
            table=sale.table.name if sale.table else None,
            guest_name=(
                sale.guest.get_full_name() or sale.guest.username
                if sale.guest
                else "Walk-in"
            ),
            total_amount=sale.total_amount if can_see_total else None,
            opened_by_name=sale.opened_by.get_full_name() or sale.opened_by.username,
            opened_at=sale.opened_at,
            # Invoice/payment data (when CLOSED)
            payment_status=sale.payment_status if sale.is_closed else None,
            balance_due=sale.balance_due if sale.is_closed else None,
        )
        for sale in qs
    ]

    return SaleDashboardResponse(
        active_sales=dashboard_items,
        total_count=len(dashboard_items),
        # total_revenue_pending=total_revenue,
    )


@router.post("/{sale_id}/close", response=CloseSaleResponse)
def close_sale_endpoint(request, sale_id: int, payload: CloseSaleRequest):
    """
    Closes the sale, generates invoice, and calculates COGS.
    Transitions state from OPEN to CLOSED.
    """

    sale = get_object_or_404(Sale, id=sale_id)

    #  Policy Check
    can_close_sale(request.auth, sale)

    try:
        closed_sale = CloseSaleService.close_sale(
            sale=sale,
            performer=request.auth,
            tax_amount=payload.tax_amount,
            discount_amount=payload.discount_amount,
            close_reason=payload.close_reason or "",
        )
    except ValidationError as e:
        return 422, {"detail": str(e)}

    return CloseSaleResponse(
        sale_id=closed_sale.pk,
        state=closed_sale.state,
        payment_status=closed_sale.payment_status,
        subtotal_amount=closed_sale.subtotal_amount,
        discount_amount=closed_sale.discount_amount,
        tax_amount=closed_sale.tax_amount,
        total_amount=closed_sale.total_amount,
        total_cost=closed_sale.total_cost,
        gross_profit=closed_sale.gross_profit,
        gross_margin_percent=closed_sale.gross_margin_percent,
    )


@router.post("/{sale_id}/cancel", response=CancelSaleResponse)
def cancel_sale_endpoint(request, sale_id: int, payload: CancelSaleRequest):
    """
    Cancels/voids an OPEN sale.
    CLOSED sales with payments should use refund endpoints instead.
    """

    sale = get_object_or_404(Sale, id=sale_id)

    # Policy Check
    can_cancel_close_sale(request.auth, sale)

    try:
        canceled_sale = CancelSaleService.cancel_open_sale(
            sale=sale, performer=request.auth, cancel_reason=payload.cancel_reason
        )
    except ValidationError as e:
        return 422, {"detail": str(e)}

    return CancelSaleResponse(
        sale_id=canceled_sale.pk,
        state=canceled_sale.state,
        canceled_at=canceled_sale.canceled_at,
        canceled_by_name=(
            canceled_sale.canceled_by.get_full_name()
            or canceled_sale.canceled_by.username
        ),
        cancel_reason=canceled_sale.cancel_reason,
    )
