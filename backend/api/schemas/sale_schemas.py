from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from apps.sale.models import Sale
from ninja import Field, Schema


class SaleType(str, Enum):
    DINE_IN = Sale.SaleType.DINE_IN
    TAKEAWAY = Sale.SaleType.TAKEAWAY


class SaleState(str, Enum):
    OPEN = Sale.SaleState.OPEN
    CLOSED = Sale.SaleState.CLOSED
    CANCELED = Sale.SaleState.CANCELED


class PaymentStatus(str, Enum):
    UNPAID = Sale.PaymentStatus.UNPAID
    PARTIALLY_PAID = Sale.PaymentStatus.PARTIALLY_PAID
    PAID = Sale.PaymentStatus.PAID


class ExtraItemInput(Schema):
    product_id: int
    quantity: int


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
    # Optional fields for updating sale metadata
    sale_type: Optional[SaleType] = None
    table_id: Optional[int] = None
    guest_id: Optional[int] = None
    guest_count: Optional[int] = None


class OpenSaleRequest(Schema):
    sale_type: SaleType
    table_id: Optional[int]
    guest_id: Optional[int]
    guest_count: Optional[int] = None
    note: Optional[str]
    # For opening, we use the same structure, but item_id will naturally be null/ignored
    items: List[SyncSaleItemInput]


class OpenSaleResponse(Schema):
    id: int
    total_amount: Decimal
    state: str


class ExtraDetailSchema(Schema):
    """
    Represents a child item (Extra) attached to a main dish.
    """

    id: int  # SaleItem PK (For deletions/updates)
    product_id: int  # Inventory Product ID (For identification)
    product_name: str  # Display Name
    quantity: int
    unit_price: Decimal
    total: Decimal


class SaleItemDetailSchema(Schema):
    """
    Represents a main menu item (Parent) in the sale.
    """

    id: int  # SaleItem PK
    menu_id: Optional[int]  # The Menu ID (Mapped back from Product)
    product_name: str
    quantity: int
    unit_price: Decimal
    total: Decimal
    extras: List[ExtraDetailSchema]  # Nested list of extras


class SaleDetailResponse(Schema):
    """
    Full Sale details for the Edit/View screen.
    Unified model including invoice and COGS data.
    """

    # ---- Sale Metadata ----
    id: int
    state: str
    sale_type: str
    table_id: Optional[int]
    table_name: Optional[str]
    guest_name: Optional[str]
    guest_count: Optional[int]
    note: str
    opened_at: datetime
    opened_by_name: str
    modified_by_name: Optional[str] = None

    # ---- Financial Data ----
    subtotal_amount: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal

    # ---- Invoice Data (when CLOSED) ----
    payment_status: Optional[str] = None
    closed_at: Optional[datetime] = None
    closed_by_name: Optional[str] = None

    # ---- Payment Tracking (when CLOSED) ----
    total_paid: Optional[Decimal] = None
    balance_due: Optional[Decimal] = None
    is_fully_paid: Optional[bool] = None

    # ---- COGS & Revenue (when CLOSED, if has permission) ----
    total_cost: Optional[Decimal] = None
    gross_profit: Optional[Decimal] = None
    gross_margin_percent: Optional[Decimal] = None

    # ---- Cancellation (when CANCELED) ----
    canceled_at: Optional[datetime] = None
    canceled_by_name: Optional[str] = None
    cancel_reason: Optional[str] = None

    # ---- Items ----
    items: List[SaleItemDetailSchema]


class SaleDashboardItemSchema(Schema):
    """
    Lightweight summary of a sale for the main dashboard view.
    Optimized for rendering cards/grids of active tables.
    """

    id: int
    state: str
    table: Optional[str] = None  # Flattened from Table object
    guest_name: Optional[str] = None  # Flattened from User object

    total_amount: Optional[Decimal]
    opened_by_name: str  # Staff member name
    opened_at: datetime  # Frontend can calc "Time Elapsed" from this

    # ---- Invoice/Payment (when CLOSED) ----
    payment_status: Optional[str] = None
    balance_due: Optional[Decimal] = None


class SaleDashboardResponse(Schema):
    """
    The full dashboard payload.
    Can be expanded later to include aggregate stats (e.g., "Total Open Orders: 5").
    """

    active_sales: List[SaleDashboardItemSchema]
    total_count: int
    # total_revenue_pending: Decimal


# ==================== Close Sale Schemas ====================


class PaymentMethodEnum(str, Enum):
    """Payment method choices"""

    CASH = "CASH"
    POS = "POS"
    CARD_TRANSFER = "CARD_TRANSFER"


class PaymentInputSchema(Schema):
    """Schema for a single payment input"""

    method: PaymentMethodEnum
    amount_applied: Decimal = Field(..., gt=0, description="Amount applied to invoice")
    tip_amount: Decimal = Field(default=Decimal("0"), ge=0, description="Optional tip")
    destination_account_id: Optional[int] = Field(
        default=None, description="Required for POS and CARD_TRANSFER"
    )


class CloseSaleRequest(Schema):
    """Request to finalize sale and process payments"""

    tax_amount: Decimal = Field(default=Decimal("0"), ge=0)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0)
    payments: List[PaymentInputSchema] = Field(
        default_factory=list, description="Payments to process (can be empty)"
    )


class PaymentDetailSchema(Schema):
    """Payment details in response"""

    id: int
    method: str
    amount_total: Decimal
    amount_applied: Decimal
    tip_amount: Decimal
    destination_account_id: Optional[int]
    received_at: datetime


class CloseSaleResponse(Schema):
    """Response after finalizing a sale"""

    sale_id: int
    invoice_number: str
    state: str
    payment_status: str
    subtotal_amount: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    total_cost: Decimal
    gross_profit: Decimal
    gross_margin_percent: Decimal
    total_paid: Decimal
    balance_due: Decimal
    is_fully_paid: bool
    payments: List[PaymentDetailSchema]


# ==================== Cancel Sale Schemas ====================


class CancelSaleRequest(Schema):
    """Request to cancel/void a sale"""

    cancel_reason: str = Field(
        ..., min_length=1, description="Required cancellation reason"
    )


class CancelSaleResponse(Schema):
    """Response after canceling a sale"""

    sale_id: int
    state: str
    canceled_at: datetime
    canceled_by_name: str
    cancel_reason: str


# ==================== Error Schemas ====================


class ErrorResponse(Schema):
    """Generic error response for validation and business logic errors"""

    detail: str
