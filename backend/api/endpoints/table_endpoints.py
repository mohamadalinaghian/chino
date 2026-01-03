"""
Table API endpoints.
Provides table availability information for sale creation.
"""

from apps.inventory.models import Table
from apps.sale.models import Sale
from ninja import Router

from ..schemas.table_schemas import TableSchema
from ..security.auth import jwt_auth

router_table = Router(tags=["Tables"], auth=jwt_auth)


@router_table.get(
    "/empty/",
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
    tables_with_open_sales = (
        Sale.objects.filter(state="OPEN", table__isnull=False)
        .values_list("table_id", flat=True)
        .distinct()
    )

    # Get active tables without open sales
    empty_tables = (
        Table.objects.filter(is_active=True)
        .exclude(id__in=tables_with_open_sales)
        .order_by("name")
    )

    return [
        TableSchema(
            id=table.pk,
            name=table.name,
            capacity=table.capacity,
            is_active=table.is_active,
        )
        for table in empty_tables
    ]
