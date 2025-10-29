import pytest
from apps.user.models import Account
from apps.user.tests.factories import AccountFactory
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test.utils import override_settings


@pytest.mark.django_db
class TestAccountManager:
    # --------------------------------------------------------------------- #
    # create_user – happy path
    # --------------------------------------------------------------------- #
    def test_create_user_happy_path(self):
        """create_user creates a normal active user with a usable password."""
        user = Account.objects.create_user(
            mobile="09000000001", name="John Doe", password="secret123"
        )
        assert user.mobile == "09000000001"
        assert user.name == "John Doe"
        assert user.check_password("secret123")
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False
        assert user.slug == "09000000001"

    def test_create_user_no_password(self):
        """create_user with no password sets an unusable password."""
        user = Account.objects.create_user(mobile="09000000002", name="Jane Doe")
        assert user.mobile == "09000000002"
        assert user.name == "Jane Doe"
        assert user.has_usable_password() is False
        assert user.is_active is True
        assert user.slug == "09000000002"

    # --------------------------------------------------------------------- #
    # create_user – error cases
    # --------------------------------------------------------------------- #
    def test_create_user_missing_mobile(self):
        """create_user raises ValueError when mobile is empty."""
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValueError) as exc:
                Account.objects.create_user(mobile="", name="John Doe")
            assert "The given mobile must be set" in str(exc.value)

    def test_create_user_invalid_mobile(self):
        """create_user raises ValidationError for a mobile that fails the regex."""
        user = AccountFactory.build(mobile="1234567890")
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                user.full_clean()  # Triggers regex validator
                Account.objects.create_user(mobile="1234567890", name="John Doe")
            assert (
                "Mobile number must be in the format 09XXXXXXXXX" in exc.value.messages
            )

    def test_create_user_duplicate_mobile(self):
        """create_user raises IntegrityError when mobile already exists."""
        AccountFactory(mobile="09000000003")
        with pytest.raises(IntegrityError):
            Account.objects.create_user(mobile="09000000003", name="Duplicate User")

    # --------------------------------------------------------------------- #
    # create_superuser – happy path
    # --------------------------------------------------------------------- #
    def test_create_superuser_happy_path(self):
        """create_superuser creates a staff + superuser with a usable password."""
        admin = Account.objects.create_superuser(
            mobile="09000000004", name="Admin User", password="admin123"
        )
        assert admin.mobile == "09000000004"
        assert admin.name == "Admin User"
        assert admin.check_password("admin123")
        assert admin.is_active is True
        assert admin.is_staff is True
        assert admin.is_superuser is True
        assert admin.slug == "09000000004"

    def test_create_superuser_no_password(self):
        """create_superuser with no password sets an unusable password."""
        admin = Account.objects.create_superuser(
            mobile="09000000005", name="Admin NoPass", password=None
        )
        assert admin.mobile == "09000000005"
        assert admin.name == "Admin NoPass"
        assert admin.has_usable_password() is False
        assert admin.is_staff is True
        assert admin.is_superuser is True

    # --------------------------------------------------------------------- #
    # create_superuser – error cases
    # --------------------------------------------------------------------- #
    def test_create_superuser_missing_password(self):
        """create_superuser requires a password argument (can be None)."""
        with pytest.raises(TypeError) as exc:
            Account.objects.create_superuser(mobile="09000000006", name="Bad Admin")
        assert "missing 1 required positional argument: 'password'" in str(exc.value)

    def test_create_superuser_not_staff(self):
        """create_superuser refuses to create a superuser without is_staff=True."""
        with pytest.raises(ValueError) as exc:
            Account.objects.create_superuser(
                mobile="09000000007",
                name="Bad Admin",
                password="pass",
                is_staff=False,
            )
        assert "Superuser must have is_staff=True and is_superuser=True" in str(
            exc.value
        )

    def test_create_superuser_not_superuser(self):
        """create_superuser refuses to create a superuser without is_superuser=True."""
        with pytest.raises(ValueError) as exc:
            Account.objects.create_superuser(
                mobile="09000000008",
                name="Bad Admin",
                password="pass",
                is_superuser=False,
            )
        assert "Superuser must have is_staff=True and is_superuser=True" in str(
            exc.value
        )

    # --------------------------------------------------------------------- #
    # extra fields handling
    # --------------------------------------------------------------------- #
    def test_create_user_extra_fields(self):
        """create_user respects additional fields passed via extra_fields."""
        user = Account.objects.create_user(
            mobile="09000000009",
            name="Extra User",
            password="pass",
            is_staff=True,
        )
        assert user.is_staff is True
        assert user.is_active is True
        assert user.is_superuser is False

    # --------------------------------------------------------------------- #
    # _create_user internal helper (used by both public methods)
    # --------------------------------------------------------------------- #
    def test__create_user_sets_password(self):
        """_create_user hashes the password when one is supplied."""
        manager = Account.objects
        user = manager._create_user(
            mobile="09000000011", name="Internal User", password="internal123"
        )
        assert user.check_password("internal123")

    def test__create_user_unusable_password(self):
        """_create_user sets an unusable password when password is None."""
        manager = Account.objects
        user = manager._create_user(
            mobile="09000000012", name="NoPass User", password=None
        )
        assert user.has_usable_password() is False
