"""
Invoice payment workflow endpoints.

This module implements the integrated invoice+payment flow:
1. POST /sales/{sale_id}/initiate-invoice - Start invoice from OPEN sale
2. POST /invoices/{invoice_id}/process-payment - Add payment (auto-closes if fully paid)
3. POST /invoices/{invoice_id}/cancel - Cancel/abort invoice (rollback)
4. GET /invoices/{invoice_id} - Get invoice details

See INVOICE_PAYMENT_API_DESIGN.md for complete documentation.
"""
from decimal import Decimal

from api.schemas.invoice_schemas import (
    CancelInvoiceRequest,
    CancelInvoiceResponse,
    InitiateInvoiceRequest,
    InitiateInvoiceResponse,
    InvoiceDetailResponse,
    PaymentDetailSchema,
    ProcessPaymentRequest,
    ProcessPaymentResponse,
)
from api.security.auth import jwt_auth
from apps.sale.models import Sale, SaleInvoice
from apps.sale.policies import (
    can_cancel_invoice,
    can_create_invoice,
    can_issue_payment,
    can_view_invoice,
)
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django_ratelimit.decorators import ratelimit
from ninja import Router

router = Router(tags=["Invoices"], auth=jwt_auth)


@router.post("/sales/{sale_id}/initiate-invoice", response=InitiateInvoiceResponse)
@ratelimit(key="user", rate="5/m", method="POST")
def initiate_invoice(request, sale_id: int, payload: InitiateInvoiceRequest):
    """
    Initiate invoice from an OPEN sale.

    This starts the payment process. The sale does NOT need to be CLOSED first.

    Business Rules:
    - Sale must be OPEN
    - Sale must have items
    - Sale cannot already have an invoice
    - Invoice created with status UNPAID
    - Sale remains OPEN

    Returns:
        InitiateInvoiceResponse with invoice details
    """
    # TODO: Implement using InitiateInvoiceService
    # 1. Verify sale exists and is OPEN
    # 2. Check permission
    # 3. Call InitiateInvoiceService.execute()
    # 4. Return response
    pass


@router.post("/invoices/{invoice_id}/process-payment", response=ProcessPaymentResponse)
@ratelimit(key="user", rate="10/m", method="POST")
def process_payment(request, invoice_id: int, payload: ProcessPaymentRequest):
    """
    Process a payment against an invoice.

    Automatically closes the sale if invoice becomes fully paid.

    Business Rules:
    - Invoice must not be VOID
    - Amount must be positive
    - If invoice becomes PAID, sale auto-closes (CLOSED)
    - If invoice is PARTIALLY_PAID, sale stays OPEN

    Scenarios:
    1. Full Payment: Invoice PAID → Sale CLOSED
    2. Partial Payment: Invoice PARTIALLY_PAID → Sale OPEN
    3. Multiple Payments: Last payment that makes it PAID → Sale CLOSED

    Returns:
        ProcessPaymentResponse with payment, invoice, and sale details
    """
    # TODO: Implement using ProcessInvoicePaymentService
    # 1. Verify invoice exists and is not VOID
    # 2. Check permission
    # 3. Call ProcessInvoicePaymentService.execute()
    # 4. Build response with all payments
    # 5. Return response
    pass


@router.post("/invoices/{invoice_id}/cancel", response=CancelInvoiceResponse)
@ratelimit(key="user", rate="5/m", method="POST")
def cancel_invoice(request, invoice_id: int, payload: CancelInvoiceRequest):
    """
    Cancel/abort an invoice (rollback scenario).

    Business Rules:
    - Invoice status becomes VOID
    - Sale remains OPEN
    - Cannot cancel if invoice has COMPLETED payments (must refund first)

    Returns:
        CancelInvoiceResponse with updated invoice and sale status
    """
    # TODO: Implement using CancelInvoiceService
    # 1. Verify invoice exists
    # 2. Check permission
    # 3. Verify no completed payments
    # 4. Call CancelInvoiceService.execute()
    # 5. Return response
    pass


@router.get("/invoices/{invoice_id}", response=InvoiceDetailResponse)
def get_invoice_detail(request, invoice_id: int):
    """
    Get complete invoice details including all payments.

    Returns:
        InvoiceDetailResponse with invoice, payments, and balance info
    """
    # TODO: Implement
    # 1. Verify invoice exists
    # 2. Check permission
    # 3. Prefetch payments
    # 4. Build response
    # 5. Return response
    pass
