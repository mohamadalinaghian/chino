from decimal import Decimal
from enum import Enum
from typing import List, Optional

from ninja import Field, Schema


class SaleType(str, Enum):
    """
    Location/type of sale.
    Explicit string values for clarity and extensibility.
    """

    DINE_IN = "DINE_IN"
    TAKEAWAY = "TAKEAWAY"


class ExtraItemInput(Schema):
    """
    Add-on item attached to a main sale item.
    Pricing is calculated via extra pricing rules.
    """

    product_id: int
    quantity: Decimal  # must be > 0


class SaleItemInput(Schema):
    """
    Main salable item.
    Pricing is calculated via menu pricing rules.
    """

    product_id: int
    quantity: int  # must be > 0
    extras: List[ExtraItemInput] = Field(default_factory=list)


class OpenSaleRequest(Schema):
    """
    Request schema for opening a sale.

    - Sale is created in OPEN state
    - Prices are calculated server-side
    - Payments are NOT allowed here
    """

    sale_type: SaleType
    table_id: Optional[int]
    guest_id: Optional[int]
    note: Optional[str]
    items: List[SaleItemInput]
