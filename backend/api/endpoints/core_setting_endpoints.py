"""
Core Settings API Endpoints

Provides access to site-wide settings and configurations.
Separated from user endpoints for clear responsibility boundaries.
"""

from api.security.auth import jwt_auth
from apps.core_setting.models import SiteSettings
from ninja import Router, Schema

router = Router(tags=["Core Settings"], auth=jwt_auth)


class POSAccountResponse(Schema):
    """Response for POS terminal account settings."""

    account_id: int | None
    card_number: str | None
    bank_name: str | None
    account_owner: str | None


@router.get("/pos-account/", response={200: POSAccountResponse})
def get_pos_account(request):
    """
    Get the default POS terminal account settings.

    Returns the configured default bank account for POS terminal payments.
    This account is used as the default destination for POS card payments.

    Returns:
        POSAccountResponse: Account details or null values if not configured
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

    return POSAccountResponse(
        account_id=None,
        card_number=None,
        bank_name=None,
        account_owner=None,
    )
