# /home/mohamad/chino_project/backend/apps/user/tests/test_profile/test_model.py
import pytest
from apps.user.models import Profile
from apps.user.tests.factories import AccountFactory, ProfileFactory
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test.utils import override_settings
from django.utils import timezone


@pytest.mark.django_db
class TestProfileModel:
    # --------------------------------------------------------------------- #
    # Basic field tests
    # --------------------------------------------------------------------- #
    def test_create_profile_happy_path(self):
        """Test creating a Profile with valid data."""
        profile = ProfileFactory(
            email="test@example.com",
            is_email_verified=True,
            address="123 Main St",
            birth_date=timezone.now().date(),
            sex=True,
        )
        assert profile.user is not None
        assert profile.email == "test@example.com"
        assert profile.is_email_verified is True
        assert profile.address == "123 Main St"
        assert profile.birth_date == timezone.now().date()
        assert profile.sex is True
        assert Profile.objects.filter(user=profile.user).exists()

    def test_string_representation(self):
        """Test __str__ returns user's name and mobile."""
        profile = ProfileFactory()
        expected = f"{profile.user.name}: ({profile.user.mobile})"
        assert str(profile) == expected

    # --------------------------------------------------------------------- #
    # OneToOneField with Account
    # --------------------------------------------------------------------- #
    def test_user_one_to_one(self):
        """Test Profile has a one-to-one relationship with Account."""
        account = AccountFactory()
        profile = ProfileFactory(user=account)
        assert profile.user == account
        assert account.profile == profile  # Reverse accessor

    def test_user_cascade_delete(self):
        """Test deleting an Account deletes its Profile."""
        profile = ProfileFactory()
        user_id = profile.user.id
        profile.user.delete()
        assert not Profile.objects.filter(user_id=user_id).exists()

    def test_duplicate_user(self):
        """Test creating a second Profile for the same Account raises IntegrityError."""
        account = AccountFactory()
        ProfileFactory(user=account)
        with pytest.raises(IntegrityError):
            ProfileFactory(user=account)

    # --------------------------------------------------------------------- #
    # Email field (unique, nullable)
    # --------------------------------------------------------------------- #
    def test_email_nullable(self):
        """Test email can be null."""
        profile = ProfileFactory(email=None)
        assert profile.email is None
        profile.full_clean()  # Should not raise

    def test_email_unique(self):
        """Test duplicate email raises ValidationError."""
        ProfileFactory(email="duplicate@example.com")
        profile = ProfileFactory.build(email="duplicate@example.com")
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                profile.full_clean()
            assert "Profile with this Email already exists." in exc.value.messages

    def test_email_invalid(self):
        """Test invalid email format raises ValidationError."""
        profile = ProfileFactory.build(email="invalid-email")
        with override_settings(LANGUAGE_CODE="en"):
            with pytest.raises(ValidationError) as exc:
                profile.full_clean()
            assert "Enter a valid email address." in exc.value.messages

    # --------------------------------------------------------------------- #
    # is_email_verified field
    # --------------------------------------------------------------------- #
    def test_is_email_verified_default(self):
        """Test is_email_verified defaults to False."""
        profile = ProfileFactory()
        assert profile.is_email_verified is False

    def test_is_email_verified_true(self):
        """Test is_email_verified can be True."""
        profile = ProfileFactory(is_email_verified=True)
        assert profile.is_email_verified is True

    # --------------------------------------------------------------------- #
    # Address field (nullable, max_length=120)
    # --------------------------------------------------------------------- #
    def test_address_nullable(self):
        """Test address can be null."""
        profile = ProfileFactory(address=None)
        assert profile.address is None
        profile.full_clean()  # Should not raise

    def test_address_max_length(self):
        """Test address at max length (120 chars)."""
        max_address = "A" * 120
        profile = ProfileFactory(address=max_address)
        assert len(profile.address) == 120
        profile.full_clean()  # Should not raise

    def test_address_too_long(self):
        """Test address exceeding 120 chars raises ValidationError."""
        too_long_address = "A" * 121
        profile = ProfileFactory.build(address=too_long_address)
        with pytest.raises(ValidationError):
            profile.full_clean()

    # --------------------------------------------------------------------- #
    # Birth date field (nullable, db_index)
    # --------------------------------------------------------------------- #
    def test_birth_date_nullable(self):
        """Test birth_date can be null."""
        profile = ProfileFactory(birth_date=None)
        assert profile.birth_date is None
        profile.full_clean()  # Should not raise

    def test_birth_date_valid(self):
        """Test valid birth_date is saved correctly."""
        birth_date = timezone.now().date()
        profile = ProfileFactory(birth_date=birth_date)
        assert profile.birth_date == birth_date

    # --------------------------------------------------------------------- #
    # Sex field (boolean with choices)
    # --------------------------------------------------------------------- #
    def test_sex_default(self):
        """Test sex defaults to True (Male)."""
        profile = ProfileFactory()
        assert profile.sex is True

    def test_sex_choices(self):
        """Test sex can be True (Male) or False (Female)."""
        profile_male = ProfileFactory(sex=True)
        profile_female = ProfileFactory(sex=False)
        with override_settings(LANGUAGE_CODE="en"):
            assert profile_male.get_sex_display() == "Male"
            assert profile_female.get_sex_display() == "Female"

    # --------------------------------------------------------------------- #
    # Meta attributes
    # --------------------------------------------------------------------- #
    def test_meta_verbose_names(self):
        """Test verbose_name and verbose_name_plural."""
        with override_settings(LANGUAGE_CODE="en"):
            assert Profile._meta.verbose_name == "Profile"
            assert Profile._meta.verbose_name_plural == "Profiles"

    # --------------------------------------------------------------------- #
    # Edge cases
    # --------------------------------------------------------------------- #
    def test_empty_email_and_address(self):
        """Test both email and address can be empty."""
        profile = ProfileFactory(email="", address="")
        assert profile.email == ""
        assert profile.address == ""
        profile.full_clean()  # Should not raise

    def test_null_fields(self):
        """Test all nullable fields can be null."""
        profile = ProfileFactory(email=None, address=None, birth_date=None)
        assert profile.email is None
        assert profile.address is None
        assert profile.birth_date is None
        profile.full_clean()  # Should not raise

    def test_invalid_birth_date(self):
        """Test invalid birth_date format raises ValidationError."""
        profile = ProfileFactory.build(birth_date="invalid-date")
        with pytest.raises(ValidationError):
            profile.full_clean()
