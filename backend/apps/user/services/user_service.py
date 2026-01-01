from decimal import Decimal

from ..models import Account, Profile


class UserService:
    @staticmethod
    def get_creditors():
        """
        Retrieve all users whom cafe is debtor to.
        """
        return Profile.objects.filter(
            is_active=True, account_balance__gt=Decimal("0")
        ).values_list("user", "account_balance")

    @staticmethod
    def get_staff():
        return Account.objects.filter(is_active=True, is_staff=True)
