from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from apps.sale.models import Sale
from ninja import Field, Schema


class SaleType(str, Enum):
    DINE_IN = Sale.SaleType.DINE_IN
    TAKEAWAY = Sale.SaleType.TAKEAWAY


class ExtraItemInput(Schema):
    product_id: int
    quantity: Decimal


class SyncSaleItemInput(Schema):
    """
    Unified Schema for creating or updating a line item.
    - item_id: None = Create New
    - item_id: Int  = Update Existing Quantity
    """

    item_id: Optional[int] = None
    menu_id: int
    quantity: int
    extras: List[ExtraItemInput] = Field(default_factory=list)


class SyncSaleRequest(Schema):
    items: List[SyncSaleItemInput]


class OpenSaleRequest(Schema):
    sale_type: SaleType
    table_id: Optional[int]
    guest_id: Optional[int]
    guest_count: Optional[int] = None
    note: Optional[str]
    # For opening, we use the same structure, but item_id will naturally be null/ignored
    items: List[SyncSaleItemInput]


class OpenSaleResponse(Schema):
    sale_id: int
    total_amount: Decimal
    state: str


class ExtraDetailSchema(Schema):
    """
    Represents a child item (Extra) attached to a main dish.
    """

    id: int  # SaleItem PK (For deletions/updates)
    product_id: int  # Inventory Product ID (For identification)
    product_name: str  # Display Name
    quantity: Decimal
    unit_price: Decimal
    total: Decimal


class SaleItemDetailSchema(Schema):
    """
    Represents a main menu item (Parent) in the sale.
    """

    id: int  # SaleItem PK
    menu_id: Optional[int]  # The Menu ID (Mapped back from Product)
    product_name: str
    quantity: Decimal
    unit_price: Decimal
    total: Decimal
    extras: List[ExtraDetailSchema]  # Nested list of extras


class SaleDetailResponse(Schema):
    """
    Full Sale details for the Edit/View screen.
    """

    id: int
    state: str
    sale_type: str
    table_id: Optional[int]
    table_number: Optional[str]
    guest_name: Optional[str]
    guest_count: Optional[int]
    total_amount: Decimal
    note: str
    opened_at: datetime
    items: List[SaleItemDetailSchema]


class SaleDashboardItemSchema(Schema):
    """
    Lightweight summary of a sale for the main dashboard view.
    Optimized for rendering cards/grids of active tables.
    """

    id: int
    table: Optional[str] = None  # Flattened from Table object
    guest_name: Optional[str] = None  # Flattened from User object

    total_amount: Optional[Decimal]
    opened_by_name: str  # Staff member name
    opened_at: datetime  # Frontend can calc "Time Elapsed" from this


class SaleDashboardResponse(Schema):
    """
    The full dashboard payload.
    Can be expanded later to include aggregate stats (e.g., "Total Open Orders: 5").
    """

    active_sales: List[SaleDashboardItemSchema]
    total_count: int
    # total_revenue_pending: Decimal
