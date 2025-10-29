import pytest
from apps.user.models import Account
from apps.user.tests.factories import AccountFactory
from django.core.exceptions import ValidationError
from django.test.utils import override_settings


@pytest.mark.django_db
class TestAccountModel:
    def test_save_sets_slug(self):
        """Test save sets slug based on mobile when slug is unset."""
        user = AccountFactory(mobile="09000000010", name="Test User")
        assert user.slug == "09000000010"
        # Simulate unset slug to test generation
        user.slug = ""
        user.mobile = "09000000011"
        user.save()
        assert user.slug == "09000000011"

    def test_save_keeps_existing_slug(self):
        """Test save does not update slug when mobile changes."""
        user = AccountFactory(mobile="09000000010", name="Test User")
        assert user.slug == "09000000010"
        user.mobile = "09000000011"
        user.save()
        assert user.slug == "09000000010"  # Slug remains unchanged

    def test_save_duplicate_slug(self):
        """Test save with duplicate mobile raises IntegrityError."""
        AccountFactory(mobile="09000000012", name="User One")
        user = AccountFactory(mobile="09000000013", name="User Two")
        user.mobile = "09000000012"  # Duplicate mobile
        from django.db.utils import IntegrityError

        with pytest.raises(IntegrityError) as exc:
            user.save()
        assert (
            "duplicate key value violates unique constraint" in str(exc.value).lower()
        )

    def test_get_full_name(self):
        """Test get_full_name returns name."""
        user = AccountFactory(name="John Michael Doe")
        assert user.get_full_name() == "John Michael Doe"

    def test_get_short_name_single_word(self):
        """Test get_short_name returns full name if no spaces."""
        user = AccountFactory(name="John")
        assert user.get_short_name() == "John"

    def test_get_short_name_multiple_words(self):
        """Test get_short_name returns first word of name."""
        user = AccountFactory(name="John Michael Doe")
        assert user.get_short_name() == "John"

    def test_string_representation(self):
        """Test __str__ returns name and mobile."""
        user = AccountFactory(name="John Doe", mobile="09000000014")
        assert str(user) == "John Doe: 09000000014"

    def test_mobile_validation_valid(self):
        """Test valid mobile number format."""
        user = AccountFactory(mobile="09012345678")
        assert user.mobile == "09012345678"

    def test_mobile_validation_invalid(self):
        """Test invalid mobile number raises ValidationError."""
        user = AccountFactory.build(
            mobile="1234567890", password="pass123"
        )  # Set password
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                user.full_clean()
            assert (
                "Mobile number must be in the format 09XXXXXXXXX" in exc.value.messages
            )

    def test_mobile_unique_constraint(self):
        """Test unique mobile constraint."""
        AccountFactory(mobile="09000000015")
        user = AccountFactory.build(
            mobile="09000000015", password="pass123"
        )  # Set password
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                user.full_clean()
            assert "User Account with this Mobile already exists." in exc.value.messages

    def test_is_active_default(self):
        """Test is_active defaults to True."""
        user = AccountFactory()
        assert user.is_active is True

    def test_is_staff_default(self):
        """Test is_staff defaults to True in factory but False in create_user."""
        user = AccountFactory(is_staff=False)
        assert user.is_staff is False
        user2 = Account.objects.create_user(mobile="09000000016", name="Staff User")
        assert user2.is_staff is False

    def test_is_superuser_default(self):
        """Test is_superuser defaults to False."""
        user = AccountFactory()
        assert user.is_superuser is False

    def test_edge_empty_name(self):
        """Test creating user with empty name."""
        user = Account.objects.create_user(mobile="09000000019", name="")
        assert user.name == ""
        assert user.get_full_name() == ""
        assert user.get_short_name() == ""

    def test_edge_long_name(self):
        """Test name at max length (50 chars)."""
        long_name = "A" * 50
        user = AccountFactory(name=long_name)
        assert user.name == long_name
        assert user.get_full_name() == long_name
        assert user.get_short_name() == long_name  # No spaces, so full name

    def test_edge_long_mobile(self):
        """Test mobile at max length (11 chars)."""
        user = AccountFactory(mobile="09012345678")
        assert len(user.mobile) == 11
        assert user.slug == "09012345678"

    def test_edge_invalid_mobile_too_short(self):
        """Test mobile with fewer than 11 digits."""
        user = AccountFactory.build(
            mobile="0901234567", password="pass123"
        )  # Set password
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                user.full_clean()
            assert (
                "Mobile number must be in the format 09XXXXXXXXX" in exc.value.messages
            )

    def test_edge_invalid_mobile_too_long(self):
        """Test mobile with more than 11 digits."""
        user = AccountFactory.build(
            mobile="090123456789", password="pass123"
        )  # Set password
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                user.full_clean()
            assert (
                "Ensure this value has at most 11 characters (it has 12)."
                in exc.value.messages
            )

    def test_edge_non_persian_slug(self):
        """Test slug generation with non-Persian mobile."""
        user = AccountFactory(mobile="09000000020")
        assert user.slug == "09000000020"  # Slugify keeps digits as-is
