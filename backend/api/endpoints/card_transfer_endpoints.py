"""
Card Transfer endpoints for listing and confirming card-to-card payments.

Endpoints:
- GET /card-transfers/ - List all card transfers
- POST /card-transfers/{id}/confirm - Confirm a card transfer
- POST /card-transfers/{id}/unconfirm - Unconfirm a card transfer
- POST /card-transfers/bulk-confirm - Bulk confirm multiple transfers
- POST /card-transfers/bulk-unconfirm - Bulk unconfirm multiple transfers
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from api.security.auth import jwt_auth
from apps.sale.models import SalePayment
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from ninja import Router, Schema

router = Router(tags=["Card Transfers"], auth=jwt_auth)


class ErrorResponse(Schema):
    detail: str


class CardTransferItemSchema(Schema):
    id: int
    sale_id: int
    amount_applied: Decimal
    amount_total: Decimal
    tip_amount: Decimal
    destination_card_number: Optional[str]
    destination_account_owner: Optional[str]
    destination_bank_name: Optional[str]
    received_by_name: str
    received_at: datetime
    confirmed: bool
    status: str


class CardTransferListResponse(Schema):
    transfers: List[CardTransferItemSchema]
    total_count: int
    unconfirmed_count: int
    confirmed_count: int


class ConfirmTransferResponse(Schema):
    id: int
    confirmed: bool
    message: str


# ---------------------------------------------------------------------
# List Card Transfers
# ---------------------------------------------------------------------


@router.get("/", response={200: CardTransferListResponse, 422: ErrorResponse})
def list_card_transfers(
    request,
    confirmed: Optional[bool] = None,
    limit: int = 50,
):
    """
    Lists all card-to-card transfers with optional filtering.

    Query params:
    - confirmed: Filter by confirmation status (true/false)
    - limit: Max number of transfers to return (default: 50)
    """
    # Check permission - only superusers or users with specific permission can view
    if not request.auth.is_superuser and not request.auth.has_perm(
        "sale.view_card_transfers"
    ):
        raise PermissionDenied("You don't have permission to view card transfers")

    # Query card transfers
    qs = (
        SalePayment.objects.filter(method=SalePayment.PaymentMethod.CARD_TRANSFER)
        .select_related(
            "sale",
            "destination_account",
            "received_by",
        )
        .order_by("-received_at")
    )

    # Filter by confirmed status if provided
    if confirmed is not None:
        qs = qs.filter(confirmed=confirmed)

    # Count stats before limiting
    total_count = qs.count()
    unconfirmed_qs = qs.filter(confirmed=False)
    confirmed_qs = qs.filter(confirmed=True)
    unconfirmed_count = unconfirmed_qs.count()
    confirmed_count = confirmed_qs.count()

    # Apply limit
    qs = qs[:limit]

    # Build response
    transfers = [
        CardTransferItemSchema(
            id=payment.pk,
            sale_id=payment.sale_id,
            amount_applied=payment.amount_applied,
            amount_total=payment.amount_total,
            tip_amount=payment.tip_amount,
            destination_card_number=(
                payment.destination_account.card_number
                if payment.destination_account
                else None
            ),
            destination_account_owner=(
                payment.destination_account.account_owner
                if payment.destination_account
                else None
            ),
            destination_bank_name=(
                payment.destination_account.bank_name
                if payment.destination_account
                else None
            ),
            received_by_name=(
                payment.received_by.get_full_name() or payment.received_by.username
            ),
            received_at=payment.received_at,
            confirmed=payment.confirmed,
            status=payment.status,
        )
        for payment in qs
    ]

    return CardTransferListResponse(
        transfers=transfers,
        total_count=total_count,
        unconfirmed_count=unconfirmed_count,
        confirmed_count=confirmed_count,
    )


# ---------------------------------------------------------------------
# Confirm Card Transfer
# ---------------------------------------------------------------------


@router.post(
    "/{transfer_id}/confirm",
    response={200: ConfirmTransferResponse, 422: ErrorResponse},
)
def confirm_card_transfer(request, transfer_id: int):
    """
    Confirms a card-to-card transfer.

    Only superusers or users with specific permission can confirm transfers.
    """
    # Check permission
    if not request.auth.is_superuser and not request.auth.has_perm(
        "sale.confirm_card_transfers"
    ):
        raise PermissionDenied("You don't have permission to confirm card transfers")

    # Get the payment
    payment = get_object_or_404(
        SalePayment,
        id=transfer_id,
        method=SalePayment.PaymentMethod.CARD_TRANSFER,
    )

    # Check if already confirmed
    if payment.confirmed:
        return ConfirmTransferResponse(
            id=payment.pk,
            confirmed=True,
            message="این انتقال قبلاً تایید شده است",
        )

    # Confirm the transfer
    payment.confirmed = True
    payment.save(update_fields=["confirmed"])

    return ConfirmTransferResponse(
        id=payment.pk,
        confirmed=True,
        message="انتقال با موفقیت تایید شد",
    )


# ---------------------------------------------------------------------
# Unconfirm Card Transfer (for reversals)
# ---------------------------------------------------------------------


@router.post(
    "/{transfer_id}/unconfirm",
    response={200: ConfirmTransferResponse, 422: ErrorResponse},
)
def unconfirm_card_transfer(request, transfer_id: int):
    """
    Unconfirms a card-to-card transfer (reversal).

    Only superusers can unconfirm transfers.
    """
    # Only superusers can unconfirm
    if not request.auth.is_superuser:
        raise PermissionDenied("Only superusers can unconfirm card transfers")

    # Get the payment
    payment = get_object_or_404(
        SalePayment,
        id=transfer_id,
        method=SalePayment.PaymentMethod.CARD_TRANSFER,
    )

    # Check if already unconfirmed
    if not payment.confirmed:
        return ConfirmTransferResponse(
            id=payment.pk,
            confirmed=False,
            message="این انتقال قبلاً غیرتایید شده است",
        )

    # Unconfirm the transfer
    payment.confirmed = False
    payment.save(update_fields=["confirmed"])

    return ConfirmTransferResponse(
        id=payment.pk,
        confirmed=False,
        message="تایید انتقال با موفقیت لغو شد",
    )


# ---------------------------------------------------------------------
# Bulk Operations
# ---------------------------------------------------------------------


class BulkTransferRequest(Schema):
    transfer_ids: List[int]


class BulkTransferResponse(Schema):
    success_count: int
    failed_count: int
    message: str


@router.post(
    "/bulk-confirm",
    response={200: BulkTransferResponse, 422: ErrorResponse},
)
def bulk_confirm_card_transfers(request, payload: BulkTransferRequest):
    """
    Bulk confirm multiple card-to-card transfers.

    Only superusers or users with specific permission can confirm transfers.
    No second confirmation dialog needed.
    """
    # Check permission
    if not request.auth.is_superuser and not request.auth.has_perm(
        "sale.confirm_card_transfers"
    ):
        raise PermissionDenied("You don't have permission to confirm card transfers")

    if not payload.transfer_ids:
        return 422, {"detail": "No transfer IDs provided"}

    # Get all transfers
    transfers = SalePayment.objects.filter(
        id__in=payload.transfer_ids,
        method=SalePayment.PaymentMethod.CARD_TRANSFER,
    )

    success_count = 0
    failed_count = 0

    for transfer in transfers:
        if not transfer.confirmed:
            transfer.confirmed = True
            transfer.save(update_fields=["confirmed"])
            success_count += 1
        else:
            failed_count += 1  # Already confirmed

    # Count transfers not found
    found_ids = set(transfers.values_list("id", flat=True))
    not_found_count = len(set(payload.transfer_ids) - found_ids)
    failed_count += not_found_count

    return BulkTransferResponse(
        success_count=success_count,
        failed_count=failed_count,
        message=f"{success_count} انتقال تایید شد"
        + (f"، {failed_count} انتقال تایید نشد" if failed_count else ""),
    )


@router.post(
    "/bulk-unconfirm",
    response={200: BulkTransferResponse, 422: ErrorResponse},
)
def bulk_unconfirm_card_transfers(request, payload: BulkTransferRequest):
    """
    Bulk unconfirm multiple card-to-card transfers (undo).

    Only superusers can unconfirm transfers.
    """
    # Only superusers can unconfirm
    if not request.auth.is_superuser:
        raise PermissionDenied("Only superusers can unconfirm card transfers")

    if not payload.transfer_ids:
        return 422, {"detail": "No transfer IDs provided"}

    # Get all transfers
    transfers = SalePayment.objects.filter(
        id__in=payload.transfer_ids,
        method=SalePayment.PaymentMethod.CARD_TRANSFER,
    )

    success_count = 0
    failed_count = 0

    for transfer in transfers:
        if transfer.confirmed:
            transfer.confirmed = False
            transfer.save(update_fields=["confirmed"])
            success_count += 1
        else:
            failed_count += 1  # Already unconfirmed

    # Count transfers not found
    found_ids = set(transfers.values_list("id", flat=True))
    not_found_count = len(set(payload.transfer_ids) - found_ids)
    failed_count += not_found_count

    return BulkTransferResponse(
        success_count=success_count,
        failed_count=failed_count,
        message=f"تایید {success_count} انتقال لغو شد"
        + (f"، {failed_count} انتقال لغو نشد" if failed_count else ""),
    )
