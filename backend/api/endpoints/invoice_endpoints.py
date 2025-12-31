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
from apps.sale.models import Sale, SaleInvoice, SalePayment
from apps.sale.policies import can_view_invoice
from apps.sale.services import (
    CancelInvoiceService,
    InitiateInvoiceService,
    ProcessInvoicePaymentService,
)
from apps.user.models import BankAccount
from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.errors import HttpError

router = Router(tags=["Invoices"], auth=jwt_auth)


@router.post("/sales/{sale_id}/initiate-invoice", response={200: InitiateInvoiceResponse})
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

    Raises:
        HttpError: 403 for permission denied, 422 for validation errors
    """
    # 1. Verify sale exists
    sale = get_object_or_404(Sale, id=sale_id)

    # 2. Call service (permission check inside service)
    try:
        invoice = InitiateInvoiceService.execute(
            sale=sale,
            issued_by=request.auth,
            tax_amount=payload.tax_amount,
        )
    except PermissionDenied as e:
        raise HttpError(403, str(e))
    except ValidationError as e:
        if hasattr(e, 'message_dict'):
            messages = []
            for field, errors in e.message_dict.items():
                messages.extend(errors)
            raise HttpError(422, " | ".join(messages))
        elif hasattr(e, 'messages'):
            raise HttpError(422, " | ".join(e.messages))
        else:
            raise HttpError(422, str(e))

    # 3. Return response
    return InitiateInvoiceResponse(
        invoice_id=invoice.pk,
        invoice_number=invoice.invoice_number,
        sale_id=sale.pk,
        subtotal_amount=invoice.subtotal_amount,
        discount_amount=invoice.discount_amount,
        tax_amount=invoice.tax_amount,
        total_amount=invoice.total_amount,
        status=invoice.status,
        sale_state=sale.state,
    )


@router.post("/invoices/{invoice_id}/process-payment", response={200: ProcessPaymentResponse})
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

    Raises:
        HttpError: 403 for permission denied, 422 for validation errors
    """
    # 1. Verify invoice exists with related sale and payments
    invoice = get_object_or_404(
        SaleInvoice.objects.select_related("sale").prefetch_related("payments"),
        id=invoice_id,
    )

    # 2. Resolve destination account if provided
    destination_account = None
    if payload.destination_account_id:
        destination_account = get_object_or_404(
            BankAccount, id=payload.destination_account_id
        )

    # 3. Call service (permission check inside service)
    try:
        payment = ProcessInvoicePaymentService.execute(
            invoice=invoice,
            received_by=request.auth,
            method=SalePayment.PaymentMethod(payload.method),
            amount_applied=payload.amount_applied,
            tip_amount=payload.tip_amount,
            destination_account=destination_account,
        )
    except PermissionDenied as e:
        raise HttpError(403, str(e))
    except ValidationError as e:
        if hasattr(e, 'message_dict'):
            messages = []
            for field, errors in e.message_dict.items():
                messages.extend(errors)
            raise HttpError(422, " | ".join(messages))
        elif hasattr(e, 'messages'):
            raise HttpError(422, " | ".join(e.messages))
        else:
            raise HttpError(422, str(e))

    # 4. Refresh to get updated status and sale state
    invoice.refresh_from_db()
    sale = invoice.sale
    sale.refresh_from_db()

    # 5. Build payment list
    payments = [
        PaymentDetailSchema(
            id=p.pk,
            method=p.get_method_display(),
            amount_applied=p.amount_applied,
            tip_amount=p.tip_amount,
            amount_total=p.amount_total,
            received_at=p.received_at.isoformat(),
        )
        for p in invoice.payments.filter(status=SalePayment.PaymentStatus.COMPLETED)
    ]

    # 6. Return response
    return ProcessPaymentResponse(
        payment_id=payment.pk,
        invoice_id=invoice.pk,
        invoice_number=invoice.invoice_number,
        invoice_status=invoice.status,
        sale_id=sale.pk,
        sale_state=sale.state,
        total_amount=invoice.total_amount,
        total_paid=invoice.total_paid,
        balance_due=invoice.balance_due,
        payments=payments,
    )


@router.post("/invoices/{invoice_id}/cancel", response={200: CancelInvoiceResponse})
def cancel_invoice(request, invoice_id: int, payload: CancelInvoiceRequest):
    """
    Cancel/abort an invoice (rollback scenario).

    Business Rules:
    - Invoice status becomes VOID
    - Sale remains OPEN
    - Cannot cancel if invoice has COMPLETED payments (must refund first)

    Returns:
        CancelInvoiceResponse with updated invoice and sale status

    Raises:
        HttpError: 403 for permission denied, 422 for validation errors
    """
    # 1. Verify invoice exists with related sale
    invoice = get_object_or_404(
        SaleInvoice.objects.select_related("sale"), id=invoice_id
    )

    # 2. Call service (permission check inside service)
    try:
        invoice = CancelInvoiceService.execute(
            invoice=invoice,
            canceled_by=request.auth,
            reason=payload.reason,
        )
    except PermissionDenied as e:
        raise HttpError(403, str(e))
    except ValidationError as e:
        if hasattr(e, 'message_dict'):
            messages = []
            for field, errors in e.message_dict.items():
                messages.extend(errors)
            raise HttpError(422, " | ".join(messages))
        elif hasattr(e, 'messages'):
            raise HttpError(422, " | ".join(e.messages))
        else:
            raise HttpError(422, str(e))

    # 3. Get sale state
    sale = invoice.sale

    # 4. Return response
    return CancelInvoiceResponse(
        invoice_id=invoice.pk,
        invoice_number=invoice.invoice_number,
        invoice_status=invoice.status,
        sale_id=sale.pk,
        sale_state=sale.state,
        cancellation_reason=payload.reason,
    )


@router.get("/invoices/{invoice_id}", response={200: InvoiceDetailResponse})
def get_invoice_detail(request, invoice_id: int):
    """
    Get complete invoice details including all payments.

    Returns:
        InvoiceDetailResponse with invoice, payments, and balance info

    Raises:
        HttpError: 403 for permission denied
    """
    # 1. Verify invoice exists with related data
    invoice = get_object_or_404(
        SaleInvoice.objects.select_related("sale", "issued_by").prefetch_related(
            "payments"
        ),
        id=invoice_id,
    )

    # 2. Check permission
    try:
        can_view_invoice(request.auth, invoice)
    except PermissionDenied as e:
        raise HttpError(403, str(e))

    # 3. Build payment list
    payments = [
        PaymentDetailSchema(
            id=p.pk,
            method=p.get_method_display(),
            amount_applied=p.amount_applied,
            tip_amount=p.tip_amount,
            amount_total=p.amount_total,
            received_at=p.received_at.isoformat(),
        )
        for p in invoice.payments.filter(status=SalePayment.PaymentStatus.COMPLETED)
    ]

    # 4. Return response
    return InvoiceDetailResponse(
        invoice_id=invoice.pk,
        invoice_number=invoice.invoice_number,
        sale_id=invoice.sale_id,
        status=invoice.status,
        subtotal_amount=invoice.subtotal_amount,
        discount_amount=invoice.discount_amount,
        tax_amount=invoice.tax_amount,
        total_amount=invoice.total_amount,
        total_paid=invoice.total_paid,
        balance_due=invoice.balance_due,
        is_fully_paid=invoice.is_fully_paid,
        payments=payments,
        issued_at=invoice.issued_at.isoformat(),
        issued_by_name=invoice.issued_by.get_full_name()
        or invoice.issued_by.username,
    )
