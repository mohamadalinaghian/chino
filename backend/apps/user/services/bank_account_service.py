from ..models import BankAccount
from ..services.user_service import UserService


class BankAccountService:
    @staticmethod
    def get_creditors_account_numbers():
        """
        Get bank accounts for card transfer target selection.

        Returns accounts with positive balance first (sorted highest to lowest),
        then appends all staff accounts that aren't already in the list.

        Note: account_balance is a calculated property (total_debt - total_payment),
        so we filter using the underlying fields instead of the property.
        """
        # Get accounts with positive balance
        creditors = UserService.get_creditors()
        positive_balance_accounts = BankAccount.objects.filter(
            related_user_id_in=creditors
        )

        # Create list with balance calculated for positive balance accounts
        accounts_with_balance = [
            {
                "account": account,
                "balance": account.related_user.profile.account_balance,
            }
            for account in positive_balance_accounts
        ]

        # Sort by balance descending
        accounts_with_balance.sort(key=lambda x: x["balance"], reverse=True)

        # Get IDs of accounts already in the list
        included_account_ids = {item["account"].pk for item in accounts_with_balance}

        # Get all staff accounts not already included
        staff_accounts = (
            BankAccount.objects.select_related("related_user__profile", "related_user")
            .filter(related_user__is_staff=True)
            .exclude(pk__in=included_account_ids)
            .all()
        )

        # Append staff accounts to the list
        for account in staff_accounts:
            accounts_with_balance.append(
                {
                    "account": account,
                    "balance": account.related_user.profile.account_balance,
                }
            )

        # return [
        #     BankAccountSchema(
        #         id=item["account"].pk,
        #         card_number=item["account"].card_number,
        #         bank_name=item["account"].bank_name,
        #         account_owner=item["account"].account_owner,
        #         account_balance=str(item["balance"]),
        #     )
        #     for item in accounts_with_balance
        # ]
