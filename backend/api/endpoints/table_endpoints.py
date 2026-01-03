"""
Table API endpoints.
Provides table availability information for sale creation.
"""

from apps.inventory.models import Table
from apps.sale.models import Sale
from ninja import Router
from django.db.models import Q

from ..schemas.table_schemas import TableListResponse, TableSchema
from ..security.auth import jwt_auth

router_table = Router(tags=["Tables"], auth=jwt_auth)


@router_table.get(
    "/available",
    response=TableListResponse,
    summary="Get available tables for sale assignment",
)
def get_available_tables(request):
    """
    Fetches all active tables for sale assignment.

    Performance:
    - Simple query with is_active filter
    - Ordered by name for consistent UI
    - Lightweight payload (only essential fields)

    Use Case:
    - New sale page table selection
    - Table availability checking

    Returns:
        TableListResponse: All tables with availability status
    """
    # Fetch all tables (staff needs to see inactive ones too, but with indicator)
    all_tables = Table.objects.all().order_by("name")

    # Serialize
    table_list = [
        TableSchema(
            id=table.pk,
            name=table.name,
            capacity=table.capacity,
            is_active=table.is_active,
        )
        for table in all_tables
    ]

    # Calculate counts
    active_count = sum(1 for t in table_list if t.is_active)

    return TableListResponse(
        tables=table_list,
        total_count=len(table_list),
        active_count=active_count,
    )


@router_table.get(
    "/active",
    response=list[TableSchema],
    summary="Get only active tables (quick endpoint)",
)
def get_active_tables(request):
    """
    Fetches only active tables.
    Faster endpoint when you only need active tables.

    Performance:
    - Filtered query (is_active=True)
    - No aggregation overhead
    - Minimal response size

    Returns:
        list[TableSchema]: Active tables only
    """
    active_tables = Table.objects.filter(is_active=True).order_by("name")

    return [
        TableSchema(
            id=table.pk,
            name=table.name,
            capacity=table.capacity,
            is_active=table.is_active,
        )
        for table in active_tables
    ]


@router_table.get(
    "/empty",
    response=list[TableSchema],
    summary="Get only empty tables (no open sales)",
)
def get_empty_tables(request):
    """
    Fetches only empty tables - active tables with no open sales.
    Used for new sale table selection.

    Performance:
    - Excludes tables with OPEN sales
    - Only returns active tables
    - Ordered by name

    Returns:
        list[TableSchema]: Empty tables available for new sales
    """
    # Get IDs of tables with open sales
    tables_with_open_sales = Sale.objects.filter(
        state='OPEN',
        table__isnull=False
    ).values_list('table_id', flat=True).distinct()

    # Get active tables without open sales
    empty_tables = Table.objects.filter(
        is_active=True
    ).exclude(
        id__in=tables_with_open_sales
    ).order_by("name")

    return [
        TableSchema(
            id=table.pk,
            name=table.name,
            capacity=table.capacity,
            is_active=table.is_active,
        )
        for table in empty_tables
    ]
