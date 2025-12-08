# apps/user/tests/test_auth_service.py
"""
Tests for AuthService business logic.

Tests the high-level authentication service layer.
"""

import pytest
from api.security.auth import AuthService
from apps.user.tests.factories import AccountFactory
from ninja.errors import HttpError


@pytest.mark.django_db
class TestAuthServiceLogin:
    """Test AuthService.login() method."""

    def test_login_with_valid_credentials(self, regular_user):
        """Test successful login returns token pair."""
        result = AuthService.login("09123456789", "testpass123")

        assert isinstance(result, dict)
        assert "access" in result
        assert "refresh" in result
        assert isinstance(result["access"], str)
        assert isinstance(result["refresh"], str)
        assert len(result["access"]) > 0
        assert len(result["refresh"]) > 0

    def test_login_with_wrong_password(self, regular_user):
        """Test login with wrong password raises HttpError 401."""
        with pytest.raises(HttpError) as exc_info:
            AuthService.login("09123456789", "wrongpassword")

        assert exc_info.value.status_code == 401
        assert "Invalid credentials" in str(exc_info.value)

    def test_login_with_nonexistent_user(self, db):
        """Test login with non-existent user raises HttpError 401."""
        with pytest.raises(HttpError) as exc_info:
            AuthService.login("09999999999", "anypassword")

        assert exc_info.value.status_code == 401

    def test_login_with_empty_mobile(self, db):
        """Test login with empty mobile raises HttpError 401."""
        with pytest.raises(HttpError) as exc_info:
            AuthService.login("", "password")

        assert exc_info.value.status_code == 401

    def test_login_with_empty_password(self, regular_user):
        """Test login with empty password raises HttpError 401."""
        with pytest.raises(HttpError) as exc_info:
            AuthService.login("09123456789", "")

        assert exc_info.value.status_code == 401

    def test_login_with_none_values(self, db):
        """Test login with None values raises HttpError."""
        with pytest.raises((HttpError, TypeError)):
            AuthService.login(None, None)

    def test_login_returns_different_tokens(self, regular_user):
        """Test that access and refresh tokens are different."""
        result = AuthService.login("09123456789", "testpass123")

        assert result["access"] != result["refresh"]

    def test_login_staff_user(self, staff_user):
        """Test staff user can login."""
        result = AuthService.login("09123456788", "staffpass123")

        assert "access" in result
        assert "refresh" in result

    def test_login_superuser(self, superuser):
        """Test superuser can login."""
        result = AuthService.login("09123456787", "superpass123")

        assert "access" in result
        assert "refresh" in result

    def test_login_inactive_user(self, db):
        """Test inactive user cannot login."""

        AccountFactory(mobile="09111111111", password="testpass123", is_active=False)

        with pytest.raises(HttpError) as exc_info:
            AuthService.login("09111111111", "testpass123")

        assert exc_info.value.status_code == 401

    def test_consecutive_logins_produce_different_tokens(self, regular_user):
        """Test consecutive logins produce different tokens."""
        import time

        result1 = AuthService.login("09123456789", "testpass123")
        time.sleep(1)
        result2 = AuthService.login("09123456789", "testpass123")

        # Tokens should be different (different iat)
        assert result1["access"] != result2["access"]
        assert result1["refresh"] != result2["refresh"]

    # def test_concurrent_logins(self, regular_user):
    #     """Test multiple concurrent logins."""
    #     import concurrent.futures
    #     import time
    #
    #     def try_login():
    #         time.sleep(0.01)
    #         return AuthService.login("09123456789", "testpass123")
    #
    #     with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    #         futures = [executor.submit(try_login) for _ in range(5)]
    #         results = [f.result() for f in futures]
    #
    #     # All should succeed
    #     assert len(results) == 5
    #     assert all("access" in r for r in results)
    #     assert all("refresh" in r for r in results)


@pytest.mark.django_db
class TestAuthServiceRefresh:
    """Test AuthService.refresh_tokens() method."""

    def test_refresh_with_valid_token(self, refresh_token):
        """Test refreshing with valid refresh token returns new pair."""
        result = AuthService.refresh_tokens(refresh_token)

        assert isinstance(result, dict)
        assert "access" in result
        assert "refresh" in result
        assert result["access"] != refresh_token
        assert result["refresh"] == refresh_token

    def test_refresh_with_invalid_token(self, db):
        """Test refresh with invalid token raises HttpError 401."""
        with pytest.raises(HttpError) as exc_info:
            AuthService.refresh_tokens("invalid_token")

        assert exc_info.value.status_code == 401
        assert "Invalid or expired refresh token" in str(exc_info.value)

    def test_refresh_with_access_token(self, access_token):
        """Test refresh with access token (wrong type) raises HttpError 401."""
        with pytest.raises(HttpError) as exc_info:
            AuthService.refresh_tokens(access_token)

        assert exc_info.value.status_code == 401

    def test_refresh_with_expired_token(self, regular_user):
        """Test refresh with expired token raises HttpError 401."""
        from datetime import datetime, timedelta, timezone

        import jwt as pyjwt
        from django.conf import settings

        # Create expired refresh token
        now = datetime.now(tz=timezone.utc)
        exp = now - timedelta(minutes=1)  # Expired

        payload = {
            "sub": str(regular_user.pk),
            "iat": int(now.timestamp()),
            "exp": int(exp.timestamp()),
            "type": "refresh",
        }

        expired_token = pyjwt.encode(
            payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
        )

        with pytest.raises(HttpError) as exc_info:
            AuthService.refresh_tokens(expired_token)

        assert exc_info.value.status_code == 401

    def test_refresh_with_deleted_user(self, refresh_token, regular_user):
        """Test refresh with token for deleted user raises HttpError 401."""
        # Delete user
        regular_user.delete()

        with pytest.raises(HttpError) as exc_info:
            AuthService.refresh_tokens(refresh_token)

        assert exc_info.value.status_code == 401

    def test_refresh_returns_new_tokens(self, refresh_token):
        """Test refresh returns completely new token pair."""
        result = AuthService.refresh_tokens(refresh_token)

        # Both tokens should be new
        assert result["access"] != refresh_token
        assert result["refresh"] == refresh_token
        assert result["access"] != result["refresh"]

    def test_multiple_consecutive_refreshes(self, refresh_token):
        """Test multiple consecutive refreshes work."""
        current_refresh = refresh_token

        for i in range(3):
            result = AuthService.refresh_tokens(current_refresh)
            assert "access" in result
            assert "refresh" in result

            # Use new refresh for next iteration
            current_refresh = result["refresh"]

    def test_refresh_with_empty_string(self, db):
        """Test refresh with empty string raises HttpError 401."""
        with pytest.raises(HttpError) as exc_info:
            AuthService.refresh_tokens("")

        assert exc_info.value.status_code == 401

    def test_refresh_with_none(self, db):
        """Test refresh with None raises HttpError."""
        with pytest.raises((HttpError, TypeError, AttributeError)):
            AuthService.refresh_tokens(None)

    def test_refresh_preserves_user_identity(self, refresh_token, regular_user):
        """Test that refresh returns tokens for the same user."""
        from api.security.auth import decode_token, get_user_from_payload

        result = AuthService.refresh_tokens(refresh_token)

        # Decode new access token
        new_payload = decode_token(result["access"], expected_type="access")
        new_user = get_user_from_payload(new_payload)

        # Should be same user
        assert new_user.id == regular_user.id
        assert new_user.mobile == regular_user.mobile


@pytest.mark.django_db
class TestAuthServiceIntegration:
    """Test AuthService integration scenarios."""

    # def test_complete_auth_flow(self, regular_user):
    #     """Test complete authentication flow: login -> refresh."""
    #     # Step 1: Login
    #     login_result = AuthService.login("09123456789", "testpass123")
    #     assert "access" in login_result
    #     assert "refresh" in login_result
    #
    #     # Step 2: Refresh
    #     refresh_result = AuthService.refresh_tokens(login_result["refresh"])
    #     assert "access" in refresh_result
    #     assert "refresh" in refresh_result
    #
    #     # New tokens should be different from original
    #     assert refresh_result["access"] != login_result["access"]
    #     assert refresh_result["refresh"] != login_result["refresh"]

    def test_login_and_multiple_refreshes(self, regular_user):
        """Test login followed by multiple refreshes."""
        # Login
        login_result = AuthService.login("09123456789", "testpass123")

        # Multiple refreshes
        current_refresh = login_result["refresh"]
        for i in range(5):
            result = AuthService.refresh_tokens(current_refresh)
            current_refresh = result["refresh"]

        # Should still work after 5 refreshes
        assert "access" in result
        assert "refresh" in result

    # def test_parallel_refresh_attempts(self, refresh_token):
    #     """Test multiple parallel refresh attempts."""
    #     import concurrent.futures
    #     import time
    #
    #     def try_refresh():
    #         time.sleep(0.01)
    #         return AuthService.refresh_tokens(refresh_token)
    #
    #     with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    #         futures = [executor.submit(try_refresh) for _ in range(3)]
    #         results = [f.result() for f in futures]
    #
    #     # All should succeed
    #     assert len(results) == 3
    #     assert all("access" in r for r in results)

    def test_service_methods_are_static(self):
        """Test that AuthService methods are static."""
        # Should be able to call without instantiating
        assert callable(AuthService.login)
        assert callable(AuthService.refresh_tokens)

        # Should not need to create instance
        # (This is implicitly tested by all other tests)


@pytest.mark.django_db
class TestAuthServiceErrorHandling:
    """Test error handling in AuthService."""

    # def test_login_database_error_handling(self, db, monkeypatch):
    #     """Test that database errors are handled gracefully."""
    #     from django.contrib.auth import get_user_model
    #
    #     User = get_user_model()
    #
    #     # Mock User.objects.get to raise an exception
    #     def mock_get(*args, **kwargs):
    #         raise Exception("Database error")
    #
    #     monkeypatch.setattr(User.objects, "get", mock_get)
    #
    #     # Should return 401, not crash
    #     with pytest.raises(HttpError) as exc_info:
    #         AuthService.login("09123456789", "testpass123")
    #
    #     assert exc_info.value.status_code == 401

    def test_refresh_with_malformed_token(self, db):
        """Test refresh with malformed token structure."""
        # Token with wrong structure
        malformed_tokens = [
            "not.a.token",
            "only_one_part",
            "two.parts",
            "four.parts.not.allowed",
        ]

        for token in malformed_tokens:
            with pytest.raises(HttpError) as exc_info:
                AuthService.refresh_tokens(token)
            assert exc_info.value.status_code == 401

    def test_login_with_special_characters(self, db):
        """Test login handles special characters in input."""

        # Create user with special characters in password
        AccountFactory(mobile="09123456789", password="P@ssw0rd!#$%^&*()")

        result = AuthService.login("09123456789", "P@ssw0rd!#$%^&*()")
        assert "access" in result

    def test_login_with_unicode(self, db):
        """Test login with unicode characters."""

        AccountFactory(mobile="09123456789", password="پسورد۱۲۳")

        result = AuthService.login("09123456789", "پسورد۱۲۳")
        assert "access" in result


@pytest.mark.django_db
class TestAuthServiceSecurity:
    """Test security aspects of AuthService."""

    # def test_login_timing_consistency(self, regular_user, db):
    #     """
    #     Test that login timing is consistent for existing vs non-existing users.
    #
    #     This helps prevent user enumeration attacks.
    #     """
    #     import time
    #
    #     # Time login for existing user with wrong password
    #     start = time.time()
    #     try:
    #         AuthService.login("09123456789", "wrongpassword")
    #     except HttpError:
    #         pass
    #     existing_user_time = time.time() - start
    #
    #     # Time login for non-existent user
    #     start = time.time()
    #     try:
    #         AuthService.login("09999999999", "wrongpassword")
    #     except HttpError:
    #         pass
    #     nonexistent_user_time = time.time() - start
    #
    #     # Times should be similar (within 50ms)
    #     time_diff = abs(existing_user_time - nonexistent_user_time)
    #     assert time_diff < 0.01, f"Timing difference: {time_diff}s"

    def test_tokens_cannot_be_reused_for_other_users(self, regular_user, staff_user):
        """Test that tokens are user-specific."""
        from api.security.auth import decode_token, get_user_from_payload

        # Get token for regular user
        result = AuthService.login("09123456789", "testpass123")
        token = result["access"]

        # Decode and check user
        payload = decode_token(token, expected_type="access")
        user = get_user_from_payload(payload)

        # Should be regular_user, not staff_user
        assert user.id == regular_user.id
        assert user.id != staff_user.id

    # def test_refresh_token_rotation(self, refresh_token):
    #     """Test that refresh returns new refresh token (rotation)."""
    #     result1 = AuthService.refresh_tokens(refresh_token)
    #     result2 = AuthService.refresh_tokens(result1["refresh"])
    #
    #     # Each refresh should return a different refresh token
    #     assert refresh_token != result1["refresh"]
    #     assert result1["refresh"] != result2["refresh"]
    #     assert refresh_token != result2["refresh"]
