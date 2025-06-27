from datetime import date

import pytest
from apps.user.models import Account, Profile
from django.db import IntegrityError
from django.utils.translation import gettext_lazy as _


@pytest.fixture
def create_user():
    user_data = {
        "mobile": "09123456789",
        "password": "testpass123",
        "name": "Test User Profile",
    }
    user = Account.objects.create_user(**user_data)
    return user


@pytest.fixture
def profile_data(create_user):
    full_data = {
        "user": create_user,
        "email": "test@user.profile",
        "address": "123 Test Street",
        "birth_date": date(1990, 1, 1),
        "sex": True,
        "is_email_verified": False,
    }
    return full_data


@pytest.mark.django_db
class TestUserProfile:
    """
    Test profile model.
    """

    def test_create_user_profile(self, profile_data):

        profile = Profile.objects.create(**profile_data)
        assert profile.user == profile_data["user"]
        assert profile.email == profile_data["email"]
        assert profile.address == profile_data["address"]
        assert profile.birth_date == profile_data["birth_date"]
        assert profile.sex == profile_data["sex"]
        assert profile.is_email_verified == profile_data["is_email_verified"]

    @pytest.mark.parametrize(
        "omit",
        [
            "email",
            "address",
            "birth_date",
            "sex",
            "is_email_verified",
        ],
    )
    def test_create_user_with_differentes_arguments(self, omit, profile_data):
        profile_data_copy = profile_data.copy()
        profile_data_copy.pop(omit)
        profile = Profile.objects.create(**profile_data_copy)
        assert profile is not None

    def test_nullable_fields_can_be_blank(self, create_user):
        profile = Profile.objects.create(user=create_user)

        assert profile.email is None
        assert profile.address is None
        assert profile.birth_date is None
        assert profile.sex is True

    def test_str_method(self, profile_data):
        profile = Profile.objects.create(**profile_data)
        assert str(profile) == f"Profile of {profile.user.name} ({profile.user.mobile})"

    def test_unique_user_constraint(self, profile_data):
        Profile.objects.create(**profile_data)

        with pytest.raises(IntegrityError):
            Profile.objects.create(**profile_data)  # same user again

    @pytest.mark.parametrize(
        "sex_value, expected", [(True, _("Male")), (False, _("Female"))]
    )
    def test_sex_choice_display(self, profile_data, sex_value, expected):
        profile_data["sex"] = sex_value
        profile = Profile.objects.create(**profile_data)

        assert profile.get_sex_display() == expected
