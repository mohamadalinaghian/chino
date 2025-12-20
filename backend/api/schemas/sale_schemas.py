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
