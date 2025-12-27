"""
Table API endpoints.
Provides table availability information for sale creation.
"""

from apps.inventory.models import Table
from ninja import Router

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
