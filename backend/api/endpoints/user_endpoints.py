"""
User API Endpoints

Provides access to user-related data including bank accounts.
Separated from core_setting endpoints for clear responsibility boundaries.
"""

from typing import List, Optional

from api.security.auth import jwt_auth
from apps.core_setting.models import SiteSettings
from apps.user.services.bank_account_service import BankAccountService
from ninja import Router, Schema

router = Router(tags=["User"], auth=jwt_auth)


class BankAccountSchema(Schema):
    """Bank account schema for list response."""

    id: int
    card_number: str
    bank_name: str | None
    account_owner: str
    account_balance: str  # Decimal as string for JSON


@router.get("/bank-accounts/", response={200: List[BankAccountSchema]})
def get_bank_accounts(request):
    """
    Get bank accounts for card transfer target selection.

    Returns accounts with positive balance first (sorted highest to lowest),
    then appends all staff accounts that aren't already in the list.

    Business Logic:
        - Prioritizes accounts with debt (best payment targets)
        - Always includes staff accounts for internal transfers
        - Sorted by balance descending for easy selection

    Returns:
        List[BankAccountSchema]: Bank accounts with calculated balances
    """
    accounts_data = BankAccountService.get_accounts_for_payment_target()

    return [
        BankAccountSchema(
            id=item["account"].pk,
            card_number=item["account"].card_number,
            bank_name=item["account"].bank_name,
            account_owner=item["account"].account_owner,
            account_balance=str(item["balance"]),
        )
        for item in accounts_data
    ]


class POSAccountSchema(Schema):
    """POS terminal account schema."""

    id: Optional[int] = None
    card_number: Optional[str] = None
    bank_name: Optional[str] = None
    account_owner: Optional[str] = None


@router.get("/pos-account/", response={200: POSAccountSchema})
def get_pos_account(request):
    """
    Get the default POS terminal account from settings.

    Returns:
        POSAccountSchema: POS terminal account if configured, empty if not
    """
    settings = SiteSettings.get()

    if settings.default_pos_account:
        return POSAccountSchema(
            id=settings.default_pos_account.pk,
            card_number=settings.default_pos_account.card_number,
            bank_name=settings.default_pos_account.bank_name,
            account_owner=settings.default_pos_account.account_owner,
        )

    return POSAccountSchema()
