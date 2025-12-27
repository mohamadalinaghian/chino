"""
Table schemas for API endpoints.
Provides lightweight representations for table selection.
"""

from ninja import Schema


class TableSchema(Schema):
    """
    Lightweight table schema for selection dropdowns/grids.
    Contains only essential fields for UI rendering.
    """

    id: int  # Table ID for sale assignment
    name: str  # Display name (e.g., "1", "A1", "VIP-1")
    capacity: int  # Maximum guests (for UI hints)
    is_active: bool  # Availability status


class TableListResponse(Schema):
    """
    Response for table listing endpoint.
    Includes metadata for better UX.
    """

    tables: list[TableSchema]  # All tables
    total_count: int  # Total number of tables
    active_count: int  # Number of active tables
