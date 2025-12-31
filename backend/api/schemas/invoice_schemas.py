"""
Invoice payment workflow schemas.

This module defines the schemas for the integrated invoice+payment flow:
1. Initiate invoice from OPEN sale
2. Process payments (full/partial)
3. Cancel/abort invoice

Scenarios:
- Full Payment: Invoice PAID → Sale CLOSED automatically
- Partial Payment: Invoice PARTIALLY_PAID → Sale stays OPEN
- Abort: Invoice VOID → Sale stays OPEN
"""
from decimal import Decimal
from enum import Enum
from typing import Optional

from apps.sale.models import SaleInvoice, SalePayment
from ninja import Schema


class PaymentMethodEnum(str, Enum):
    """Payment method options."""

    CASH = SalePayment.PaymentMethod.CASH
    POS = SalePayment.PaymentMethod.POS
    CARD_TRANSFER = SalePayment.PaymentMethod.CARD_TRANSFER


class InvoiceStatusEnum(str, Enum):
    """Invoice status options."""

    UNPAID = SaleInvoice.InvoiceStatus.UNPAID
    PARTIALLY_PAID = SaleInvoice.InvoiceStatus.PARTIALLY_PAID
    PAID = SaleInvoice.InvoiceStatus.PAID
    VOID = SaleInvoice.InvoiceStatus.VOID


# ========== Request Schemas ==========


class InitiateInvoiceRequest(Schema):
    """
    Request to initiate invoice from an OPEN sale.

    The sale does NOT need to be CLOSED first. This creates the invoice
    and allows the payment process to begin.
    """

    tax_amount: Decimal = Decimal("0")


class ProcessPaymentRequest(Schema):
    """
    Request to process a payment against an invoice.

    Rules:
    - amount_applied: Amount applied to invoice balance (required, > 0)
    - tip_amount: Optional tip (default 0, cannot be negative)
    - destination_account: Required for POS and CARD_TRANSFER methods
    """

    method: PaymentMethodEnum
    amount_applied: Decimal
    tip_amount: Decimal = Decimal("0")
    destination_account_id: Optional[int] = None


class CancelInvoiceRequest(Schema):
    """
    Request to cancel/abort an invoice.

    This is the rollback scenario - marks invoice as VOID,
    sale stays OPEN so user can continue.
    """

    reason: Optional[str] = None


# ========== Response Schemas ==========


class InitiateInvoiceResponse(Schema):
    """
    Response after initiating an invoice.

    Returns the created invoice details. Sale remains OPEN.
    """

    invoice_id: int
    invoice_number: str
    sale_id: int
    subtotal_amount: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    status: str  # Will be UNPAID
    sale_state: str  # Will be OPEN


class PaymentDetailSchema(Schema):
    """Individual payment detail in response."""

    id: int
    method: str
    amount_applied: Decimal
    tip_amount: Decimal
    amount_total: Decimal
    received_at: str


class ProcessPaymentResponse(Schema):
    """
    Response after processing a payment.

    Returns:
    - Updated invoice status (UNPAID → PARTIALLY_PAID → PAID)
    - Sale state (OPEN or CLOSED if fully paid)
    - Payment details
    - Balance information
    """

    payment_id: int
    invoice_id: int
    invoice_number: str
    invoice_status: str  # UNPAID, PARTIALLY_PAID, or PAID
    sale_id: int
    sale_state: str  # OPEN or CLOSED
    total_amount: Decimal
    total_paid: Decimal
    balance_due: Decimal
    payments: list[PaymentDetailSchema]


class CancelInvoiceResponse(Schema):
    """
    Response after canceling an invoice.

    Invoice is marked VOID, sale stays OPEN.
    """

    invoice_id: int
    invoice_number: str
    invoice_status: str  # Will be VOID
    sale_id: int
    sale_state: str  # Will be OPEN
    cancellation_reason: Optional[str]


class InvoiceDetailResponse(Schema):
    """
    Detailed invoice information for viewing.

    Includes all payments, current status, and balance information.
    """

    invoice_id: int
    invoice_number: str
    sale_id: int
    status: str
    subtotal_amount: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    total_paid: Decimal
    balance_due: Decimal
    is_fully_paid: bool
    payments: list[PaymentDetailSchema]
    issued_at: str
    issued_by_name: str
