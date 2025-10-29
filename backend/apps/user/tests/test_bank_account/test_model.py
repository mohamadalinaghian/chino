import pytest
from apps.user.models import BankAccount
from apps.user.tests.factories import AccountFactory, BankAccountFactory
from django.core.exceptions import ValidationError
from django.db.models import ProtectedError
from django.test.utils import override_settings


@pytest.mark.django_db
class TestBankAccountModel:
    # --------------------------------------------------------------------- #
    # Basic field tests
    # --------------------------------------------------------------------- #
    def test_create_bank_account_happy_path(self):
        """Test creating a BankAccount with valid data."""
        bank_account = BankAccountFactory(
            bank_name="Main Account",
            card_number="6219861034529007",
            account_owner="Ali Rezaei",
        )
        assert bank_account.related_user is not None
        assert bank_account.bank_name == "Main Account"
        assert bank_account.card_number == "6219861034529007"
        assert bank_account.account_owner == "Ali Rezaei"
        assert BankAccount.objects.filter(
            related_user=bank_account.related_user
        ).exists()

    def test_string_representation(self):
        """Test __str__ returns account_owner and card_number."""
        bank_account = BankAccountFactory()
        expected = f"{bank_account.account_owner}: {bank_account.card_number}"
        assert str(bank_account) == expected

    # --------------------------------------------------------------------- #
    # ForeignKey with Account
    # --------------------------------------------------------------------- #
    def test_related_user_foreign_key(self):
        """Test BankAccount has a ForeignKey relationship with Account."""
        account = AccountFactory()
        bank_account = BankAccountFactory(related_user=account)
        assert bank_account.related_user == account
        assert account.bank_accounts.filter(
            id=bank_account.id
        ).exists()  # Reverse accessor

    def test_related_user_protect(self):
        """Test deleting an Account with a BankAccount raises ProtectedError."""
        bank_account = BankAccountFactory()
        with pytest.raises(ProtectedError):
            bank_account.related_user.delete()

    # --------------------------------------------------------------------- #
    # Name field (unique, max_length=16)
    # --------------------------------------------------------------------- #

    def test_name_max_length(self):
        """Test name at max length (16 chars)."""
        max_name = "A" * 32
        bank_account = BankAccountFactory(bank_name=max_name)
        assert len(bank_account.bank_name) == 32
        bank_account.full_clean()  # Should not raise

    def test_name_too_long(self):
        """Test name exceeding 16 chars raises ValidationError."""
        too_long_name = "A" * 47
        account = AccountFactory()
        bank_account = BankAccountFactory.build(
            bank_name=too_long_name, related_user=account
        )
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                bank_account.full_clean()
            assert (
                "Ensure this value has at most 32 characters (it has 47)."
                in exc.value.messages
            )

    # --------------------------------------------------------------------- #
    # Card number field (unique, max_length=16, validate_iran_card_number)
    # --------------------------------------------------------------------- #
    def test_card_number_unique(self):
        """Test duplicate card_number raises ValidationError."""
        BankAccountFactory(card_number="6219861034529007")
        account = AccountFactory()
        bank_account = BankAccountFactory.build(
            card_number="6219861034529007", related_user=account
        )
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                bank_account.full_clean()
            assert (
                "Bank account with this Card number already exists."
                in exc.value.messages
            )

    def test_card_number_valid(self):
        """Test valid card_number is saved correctly."""
        bank_account = BankAccountFactory(card_number="6219861034529007")
        assert bank_account.card_number == "6219861034529007"
        bank_account.full_clean()  # Should not raise

    def test_card_number_invalid(self):
        """Test invalid card_number format raises ValidationError."""
        account = AccountFactory()
        bank_account = BankAccountFactory.build(
            card_number="invalid-card", related_user=account
        )
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                bank_account.full_clean()
            assert "Card number cannot be empty." in exc.value.messages

    def test_card_number_too_short(self):
        """Test card_number with fewer than 16 digits raises ValidationError."""
        account = AccountFactory()
        bank_account = BankAccountFactory.build(
            card_number="123456789012345", related_user=account
        )
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                bank_account.full_clean()
            assert "Card number must contain exactly 16 digits." in exc.value.messages

    def test_card_number_too_long(self):
        """Test card_number exceeding 16 chars raises ValidationError."""
        account = AccountFactory()
        bank_account = BankAccountFactory.build(
            card_number="12345678901234567", related_user=account
        )
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                bank_account.full_clean()
            assert "Card number must contain exactly 16 digits." in exc.value.messages

    def test_card_number_luhn_invalid(self):
        """Test card_number failing Luhn algorithm raises ValidationError."""
        account = AccountFactory()
        bank_account = BankAccountFactory.build(
            card_number="1234567890123456", related_user=account
        )  # Invalid Luhn
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                bank_account.full_clean()
            assert "Invalid Iranian card number." in exc.value.messages

    def test_account_owner_too_long(self):
        """Test account_owner exceeding 32 chars raises ValidationError."""
        too_long_owner = "A" * 43
        account = AccountFactory()
        bank_account = BankAccountFactory.build(
            account_owner=too_long_owner, related_user=account
        )
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                bank_account.full_clean()
            assert (
                "Ensure this value has at most 32 characters (it has 43)."
                in exc.value.messages
            )

    # --------------------------------------------------------------------- #
    # Meta attributes
    # --------------------------------------------------------------------- #
    def test_meta_verbose_names(self):
        """Test verbose_name and verbose_name_plural."""
        with override_settings(LANGUAGE_CODE="en"):
            assert BankAccount._meta.verbose_name == "Bank account"
            assert BankAccount._meta.verbose_name_plural == "Bank accounts"

    # --------------------------------------------------------------------- #
    # Edge cases
    # --------------------------------------------------------------------- #
    def test_empty_name(self):
        """Test empty name raises ValidationError."""
        account = AccountFactory()
        bank_account = BankAccountFactory.build(bank_name="", related_user=account)
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                bank_account.full_clean()
            assert "This field cannot be blank." in exc.value.messages

    def test_empty_account_owner(self):
        """Test empty account_owner raises ValidationError."""
        account = AccountFactory()
        bank_account = BankAccountFactory.build(account_owner="", related_user=account)
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                bank_account.full_clean()
            assert "This field cannot be blank." in exc.value.messages
