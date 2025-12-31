"""
Settings API endpoints.

Provides access to site-wide settings.
"""
from api.security.auth import jwt_auth
from apps.core_setting.models import SiteSettings
from apps.user.models import BankAccount
from django.db.models import F
from ninja import Router, Schema
from ninja.errors import HttpError
from typing import Optional, List

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


@router.get("/pos-account", response={200: POSAccountResponse})
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


@router.get("/bank-accounts", response={200: List[BankAccountSchema]})
def get_bank_accounts(request):
    """
    Get bank accounts for card transfer target selection.

    Returns only accounts with positive balance (account_balance > 0),
    sorted from highest to lowest balance.

    Note: account_balance is a calculated property (total_debt - total_payment),
    so we filter using the underlying fields instead of the property.
    """
    # Get all accounts and filter in Python for positive balance
    # Filter on total_debt > total_payment to avoid querying computed property
    accounts = (
        BankAccount.objects
        .select_related('related_user__profile')
        .filter(related_user__profile__total_debt__gt=F('related_user__profile__total_payment'))
        .all()
    )

    # Create list with balance calculated, then sort by balance
    accounts_with_balance = [
        {
            'account': account,
            'balance': account.related_user.profile.account_balance,
        }
        for account in accounts
    ]

    # Sort by balance descending
    accounts_with_balance.sort(key=lambda x: x['balance'], reverse=True)

    return [
        BankAccountSchema(
            id=item['account'].pk,
            card_number=item['account'].card_number,
            bank_name=item['account'].bank_name,
            account_owner=item['account'].account_owner,
            account_balance=str(item['balance']),
        )
        for item in accounts_with_balance
    ]
