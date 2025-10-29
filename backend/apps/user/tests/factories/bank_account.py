# /home/mohamad/chino_project/backend/apps/user/tests/factories/bank_account.py
import factory
from apps.user.models import BankAccount
from apps.user.tests.factories.account import AccountFactory


def generate_luhn_card_number(base, n):
    """Generate a Luhn-compliant 16-digit card number."""
    base = f"{base}{n:03d}"  # e.g., 6219861034529000 + n
    digits = [int(d) for d in base[:15]]
    check_digit = 0
    for i, digit in enumerate(reversed(digits)):
        if i % 2 == 0:
            doubled = digit * 2
            digits[i] = (doubled % 10) + (doubled // 10)
    total = sum(digits)
    check_digit = (10 - (total % 10)) % 10
    return f"{base[:15]}{check_digit}"


class BankAccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BankAccount

    related_user = factory.SubFactory(AccountFactory)
    bank_name = factory.Sequence(lambda n: f"Account {n}")
    card_number = factory.Sequence(
        lambda n: generate_luhn_card_number("6219861034529", n)
    )
    account_owner = factory.Sequence(lambda n: f"Owner {n}"[:12])
