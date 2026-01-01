"""
Settings API endpoints.

Provides access to site-wide settings.
"""

from typing import Optional

from api.security.auth import jwt_auth
from apps.core_setting.models import SiteSettings
from ninja import Router, Schema

router = Router(tags=["Settings"], auth=jwt_auth)


class POSAccountResponse(Schema):
    """Response for POS account settings."""

    account_id: Optional[int]
    card_number: Optional[str]
    bank_name: Optional[str]
    account_owner: Optional[str]


class BankAccountSchema(Schema):
    """Bank account schema for list response."""

    id: int
    card_number: str
    bank_name: Optional[str]
    account_owner: str
    account_balance: str  # Decimal as string for JSON


@router.get("/pos-account/", response={200: POSAccountResponse})
def get_pos_account(request):
    """
    Get the default POS terminal account settings.

    Returns the configured default bank account for POS terminal payments.
    If no account is configured, returns null values.

    Returns:
        POSAccountResponse with account details or null if not configured
    """
    settings = SiteSettings.get()

    if settings.default_pos_account:
        account = settings.default_pos_account
        return POSAccountResponse(
            account_id=account.pk,
            card_number=account.card_number,
            bank_name=account.bank_name,
            account_owner=account.account_owner,
        )
    else:
        return POSAccountResponse(
            account_id=None,
            card_number=None,
            bank_name=None,
            account_owner=None,
        )


# @router.get("/bank-accounts/", response={200: List[BankAccountSchema]})
# def get_bank_accounts(request):
