"""Bank account business logic and data access."""

from decimal import Decimal
from typing import List, TypedDict

from ..models import BankAccount
from ..services.user_service import UserService


class BankAccountData(TypedDict):
    """Type definition for bank account data with calculated balance."""

    account: BankAccount
    balance: Decimal


class BankAccountService:
    """Service for bank account operations."""

    @staticmethod
    def get_accounts_for_payment_target() -> List[BankAccountData]:
        """
        Get bank accounts for card transfer payment targets.

        Returns accounts with positive balance first (sorted highest to lowest),
        then appends all staff accounts that aren't already in the list.

        Business Logic:
            - Prioritizes accounts with debt (positive balance = cafe owes them)
            - Always includes staff accounts for internal transfers
            - Sorted by balance descending for easy selection

        Returns:
            List of dicts with 'account' (BankAccount) and 'balance' (Decimal)
        """
        # Get user IDs with positive balance (creditors)
        creditors = UserService.get_creditors()
        creditor_user_ids = [user_id for user_id, _ in creditors]

        # Get bank accounts for these creditors with optimized queries
        positive_balance_accounts = (
            BankAccount.objects.select_related("related_user__profile")
            .filter(related_user__in=creditor_user_ids)
            .all()
        )

        # Create list with calculated balances
        accounts_with_balance: List[BankAccountData] = [
            {
                "account": account,
                "balance": account.related_user.profile.account_balance,
            }
            for account in positive_balance_accounts
        ]

        # Sort by balance descending
        accounts_with_balance.sort(key=lambda x: x["balance"], reverse=True)

        # Get IDs of accounts already included
        included_account_ids = {item["account"].pk for item in accounts_with_balance}

        # Get all staff accounts not already in the list
        staff_accounts = (
            BankAccount.objects.select_related("related_user__profile")
            .filter(related_user__is_staff=True)
            .exclude(pk__in=included_account_ids)
            .all()
        )

        # Append staff accounts with their balances
        for account in staff_accounts:
            accounts_with_balance.append(
                {
                    "account": account,
                    "balance": account.related_user.profile.account_balance,
                }
            )

        return accounts_with_balance
