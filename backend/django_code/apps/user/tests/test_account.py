import pytest
from apps.user.models import Account
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from freezegun import freeze_time


@pytest.fixture
def user_data():
    return {
        "mobile": "09123456789",
        "name": "Test User",
        "password": "complex-pass-123",
    }


@pytest.mark.django_db
class TestAccountModel:
    def test_str_method(self, user_data):
        user = Account.objects.create_user(**user_data)
        assert str(user) == f"{user_data['name']}: {user_data['mobile']}"

    def test_full_name_method(self, user_data):
        user = Account.objects.create_user(**user_data)
        assert user.get_full_name() == user_data["name"]

    def test_short_name_method(self, user_data):
        user = Account.objects.create_user(**user_data)
        assert user.get_short_name() == user_data["name"].split()[0]

    def test_create_user_fields_and_flags(self, user_data):
        user = Account.objects.create_user(**user_data)
        assert user.mobile == user_data["mobile"]
        assert user.name == user_data["name"]
        assert user.check_password(user_data["password"])
        assert user.slug == user_data["mobile"]
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False
        # timestampها
        assert user.created_at.date() == timezone.now().date()
        assert user.created_at <= user.updated_at

    @freeze_time("2025-01-01 12:00:00")
    def test_timestamps_are_exact_on_create(self, user_data):
        user = Account.objects.create_user(**user_data)
        now = timezone.now()
        assert user.created_at == now
        assert user.updated_at == now

    def test_create_user_with_is_staff_flag(self, user_data):
        data = {**user_data, "is_staff": True}
        user = Account.objects.create_user(**data)
        assert user.is_staff is True

    def test_create_superuser_with_is_superuser_and_is_staff_flag(self, user_data):
        data = {**user_data, "is_staff": True, "is_superuser": True}
        su = Account.objects.create_superuser(**data)
        assert su.is_staff is True
        assert su.is_superuser is True

    def test_duplicate_mobile_raises_integrity_error(self, user_data):
        Account.objects.create_user(**user_data)
        with pytest.raises(IntegrityError):
            Account.objects.create_user(**user_data)

    @pytest.mark.parametrize("omit", ["mobile", "name"])
    def test_missing_required_args_raises_type_error(self, user_data, omit):
        data = user_data.copy()
        data.pop(omit)
        with pytest.raises(TypeError):
            Account.objects.create_user(**data)

    def test_invalid_mobile_format_raises_validation_error(self):
        user = Account(mobile="12345", name="NoMobile")
        with pytest.raises(ValidationError) as exc:
            user.full_clean()
        err = exc.value
        assert "mobile" in err.message_dict
        # assert "invalide mobile" in str(err)

    def test_slug_does_not_change_on_mobile_update(self, user_data):
        user = Account.objects.create_user(**user_data)
        original_slug = user.slug
        user.mobile = "09300000000"
        user.save()
        assert user.slug == original_slug

    def test_create_user_without_password_sets_unusable_password(self, user_data):
        data = user_data.copy()
        data.pop("password")
        user = Account.objects.create_user(**data)
        assert user.has_usable_password() is False
