"""API Schema exports."""

# Sale schemas
from .sale_schemas import (
    ExtraDetailSchema,
    ExtraItemInput,
    OpenSaleRequest,
    OpenSaleResponse,
    SaleDashboardItemSchema,
    SaleDashboardResponse,
    SaleDetailResponse,
    SaleItemDetailSchema,
    SaleType,
    SyncSaleItemInput,
    SyncSaleRequest,
)

# Invoice payment workflow schemas
from .invoice_schemas import (
    CancelInvoiceRequest,
    CancelInvoiceResponse,
    InitiateInvoiceRequest,
    InitiateInvoiceResponse,
    InvoiceDetailResponse,
    InvoiceStatusEnum,
    PaymentDetailSchema,
    PaymentMethodEnum,
    ProcessPaymentRequest,
    ProcessPaymentResponse,
)

# Table schemas
from .table_schemas import (
    TableCreateRequest,
    TableListResponse,
    TableResponse,
    TableUpdateRequest,
)

# Auth schemas
from .auth_schemas import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    TokenRefreshRequest,
)

# Menu schemas
from .menu_schemas import (
    MenuCreateRequest,
    MenuDetailResponse,
    MenuListResponse,
    MenuUpdateRequest,
)

__all__ = [
    # Sale
    "ExtraDetailSchema",
    "ExtraItemInput",
    "OpenSaleRequest",
    "OpenSaleResponse",
    "SaleDashboardItemSchema",
    "SaleDashboardResponse",
    "SaleDetailResponse",
    "SaleItemDetailSchema",
    "SaleType",
    "SyncSaleItemInput",
    "SyncSaleRequest",
    # Invoice
    "CancelInvoiceRequest",
    "CancelInvoiceResponse",
    "InitiateInvoiceRequest",
    "InitiateInvoiceResponse",
    "InvoiceDetailResponse",
    "InvoiceStatusEnum",
    "PaymentDetailSchema",
    "PaymentMethodEnum",
    "ProcessPaymentRequest",
    "ProcessPaymentResponse",
    # Table
    "TableCreateRequest",
    "TableListResponse",
    "TableResponse",
    "TableUpdateRequest",
    # Auth
    "AuthResponse",
    "LoginRequest",
    "RegisterRequest",
    "TokenRefreshRequest",
    # Menu
    "MenuCreateRequest",
    "MenuDetailResponse",
    "MenuListResponse",
    "MenuUpdateRequest",
]
