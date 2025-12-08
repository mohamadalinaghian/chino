# apps/user/tests/test_backends.py
"""
Tests for custom authentication backend (MobileBackend).

Tests the mobile-based authentication logic.
"""

import pytest
from apps.user.backends import MobileBackend
from apps.user.tests.factories import AccountFactory
from django.contrib.auth import authenticate, get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestMobileBackend:
    """Test MobileBackend authentication."""

    def test_authenticate_with_valid_credentials(self, regular_user):
        """Test authentication with correct mobile and password."""
        user = authenticate(
            username="09123456789",  # username param contains mobile
            password="testpass123",
        )

        assert user is not None
        assert user.mobile == "09123456789"
        assert user.name == "Test User"

    def test_authenticate_with_wrong_password(self, regular_user):
        """Test authentication fails with wrong password."""
        user = authenticate(username="09123456789", password="wrongpassword")

        assert user is None

    def test_authenticate_with_nonexistent_mobile(self, db):
        """Test authentication fails with non-existent mobile."""
        user = authenticate(username="09999999999", password="anypassword")

        assert user is None

    def test_authenticate_with_none_username(self, regular_user):
        """Test authentication fails with None username."""
        user = authenticate(username=None, password="testpass123")

        assert user is None

    def test_authenticate_with_none_password(self, regular_user):
        """Test authentication fails with None password."""
        user = authenticate(username="09123456789", password=None)

        assert user is None

    def test_authenticate_inactive_user(self, db):
        """Test authentication fails for inactive users."""

        AccountFactory(mobile="09111111111", password="testpass123", is_active=False)

        user = authenticate(username="09111111111", password="testpass123")

        # user_can_authenticate checks is_active
        assert user is None

    def test_authenticate_staff_user(self, staff_user):
        """Test staff user can authenticate."""
        user = authenticate(username="09123456788", password="staffpass123")

        assert user is not None
        assert user.is_staff is True

    def test_authenticate_superuser(self, superuser):
        """Test superuser can authenticate."""
        user = authenticate(username="09123456787", password="superpass123")

        assert user is not None
        assert user.is_superuser is True

    def test_get_user_by_id(self, regular_user):
        """Test get_user method returns user by ID."""
        backend = MobileBackend()
        user = backend.get_user(regular_user.id)

        assert user is not None
        assert user.pk == regular_user.id
        assert user.mobile == regular_user.mobile

    def test_get_user_nonexistent_id(self, db):
        """Test get_user returns None for non-existent ID."""
        backend = MobileBackend()
        user = backend.get_user(99999)

        assert user is None

    def test_get_user_inactive_user(self, db):
        """Test get_user returns None for inactive user."""

        inactive_user = AccountFactory(is_active=False)
        backend = MobileBackend()
        user = backend.get_user(inactive_user.id)

        # user_can_authenticate checks is_active
        assert user is None

    def test_timing_attack_mitigation(self, regular_user, db):
        """
        Test that backend runs password hasher even for non-existent users.

        This prevents timing attacks where an attacker could determine
        if a mobile number exists by measuring response time.
        """
        import time

        # Time authentication for existing user with wrong password
        start = time.time()
        authenticate(username="09123456789", password="wrongpassword")
        existing_user_time = time.time() - start

        # Time authentication for non-existent user
        start = time.time()
        authenticate(username="09999999999", password="wrongpassword")
        nonexistent_user_time = time.time() - start

        # Times should be similar (within 50ms)
        # This test might be flaky depending on system load
        time_diff = abs(existing_user_time - nonexistent_user_time)
        assert time_diff < 0.05, f"Timing difference too large: {time_diff}s"

    def test_case_sensitive_mobile(self, db):
        """Test that mobile authentication is case-sensitive."""

        AccountFactory(mobile="09123456789", password="testpass123")

        # Exact match should work
        result = authenticate(username="09123456789", password="testpass123")
        assert result is not None

        # Different number should fail
        result = authenticate(username="09123456788", password="testpass123")
        assert result is None

    def test_multiple_users_same_password(self, db):
        """Test multiple users can have the same password."""

        user1 = AccountFactory(mobile="09111111111", password="samepass")
        user2 = AccountFactory(mobile="09222222222", password="samepass")

        # Both should authenticate correctly
        result1 = authenticate(username="09111111111", password="samepass")
        assert result1.id == user1.id

        result2 = authenticate(username="09222222222", password="samepass")
        assert result2.id == user2.id

    def test_password_with_special_characters(self, db):
        """Test authentication with special characters in password."""

        AccountFactory(mobile="09123456789", password="P@ssw0rd!#$%^&*()")

        result = authenticate(username="09123456789", password="P@ssw0rd!#$%^&*()")
        assert result is not None

    def test_unicode_password(self, db):
        """Test authentication with unicode (Persian) password."""

        AccountFactory(mobile="09123456789", password="پسورد۱۲۳")

        result = authenticate(username="09123456789", password="پسورد۱۲۳")
        assert result is not None


@pytest.mark.django_db
class TestAuthenticationBackendIntegration:
    """Test authentication backend integration with Django."""

    def test_backend_in_settings(self):
        """Test that MobileBackend is registered in settings."""
        from django.conf import settings

        assert "apps.user.backends.MobileBackend" in settings.AUTHENTICATION_BACKENDS

    def test_fallback_to_model_backend(self, db):
        """Test that ModelBackend is still available as fallback."""
        from django.conf import settings

        # Should have both backends
        assert len(settings.AUTHENTICATION_BACKENDS) >= 2
        assert (
            "django.contrib.auth.backends.ModelBackend"
            in settings.AUTHENTICATION_BACKENDS
        )

    def test_django_admin_authentication(self, superuser):
        """
        Test that superuser can authenticate (for Django admin).

        This ensures backward compatibility with Django admin.
        """
        user = authenticate(username="09123456787", password="superpass123")

        assert user is not None
        assert user.is_superuser is True
        assert user.is_staff is True

    def test_permissions_inherited_from_model_backend(self, staff_user):
        """Test that permission methods are inherited from ModelBackend."""
        backend = MobileBackend()

        # These methods should exist (inherited from ModelBackend)
        assert hasattr(backend, "has_perm")
        assert hasattr(backend, "has_module_perms")
        assert hasattr(backend, "get_user_permissions")
        assert hasattr(backend, "get_group_permissions")
        assert hasattr(backend, "get_all_permissions")


@pytest.mark.django_db
class TestAuthenticationEdgeCases:
    """Test edge cases in authentication."""

    def test_empty_string_mobile(self, db):
        """Test authentication with empty string mobile."""
        user = authenticate(username="", password="test")
        assert user is None

    def test_empty_string_password(self, regular_user):
        """Test authentication with empty string password."""
        user = authenticate(username="09123456789", password="")
        assert user is None

    def test_whitespace_in_mobile(self, regular_user):
        """Test authentication fails with whitespace in mobile."""
        user = authenticate(username=" 09123456789 ", password="testpass123")
        # Should fail because mobile doesn't match exactly
        assert user is None

    def test_very_long_password(self, db):
        """Test authentication with very long password."""

        long_password = "a" * 1000
        AccountFactory(mobile="09123456789", password=long_password)

        result = authenticate(username="09123456789", password=long_password)
        assert result is not None

    def test_null_bytes_in_password(self, db):
        """Test authentication handles null bytes in password."""

        # Python strings can contain null bytes
        password_with_null = "pass\x00word"
        AccountFactory(mobile="09123456789", password=password_with_null)

        result = authenticate(username="09123456789", password=password_with_null)
        assert result is not None

    def test_user_with_no_password(self, db):
        """Test authentication fails for user with unusable password."""

        user = AccountFactory(mobile="09123456789")
        user.set_unusable_password()
        user.save()

        result = authenticate(username="09123456789", password="anypassword")
        assert result is None
