from django.db.models import F

from ..models import Account, Profile


class UserService:
    @staticmethod
    def get_creditors():
        """
        Retrieve all users whom cafe is debtor to.

        Returns profiles where total_debt > total_payment (positive balance).
        Returns tuples of (user_id, calculated_balance).
        """
        # Filter profiles where debt exceeds payment (cafe owes them money)
        creditor_profiles = Profile.objects.filter(
            total_debt__gt=F("total_payment")
        ).select_related("user")

        # Calculate balance and return as list of tuples
        return [
            (profile.user_id, profile.account_balance) for profile in creditor_profiles
        ]

    @staticmethod
    def get_staff():
        return Account.objects.filter(is_active=True, is_staff=True)
