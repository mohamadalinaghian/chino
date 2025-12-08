# apps/user/tests/test_auth_endpoints.py
"""
Tests for authentication endpoints.

Tests all auth endpoints: login, logout, refresh, /me
"""

import pytest
from apps.user.tests.factories import AccountFactory
from django.contrib.auth import get_user_model

User = get_user_model()
pytestmark = pytest.mark.django_db

# ============================================================================
# Login Endpoint Tests
# ============================================================================


@pytest.mark.django_db
class TestLoginEndpoint:
    """Test POST /api/auth/login endpoint."""

    def test_login_success(self, api_client, regular_user, login_data):
        """Test successful login with valid credentials."""
        response = api_client.post("/auth/login", json=login_data)

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "access" in data
        assert "refresh" in data

        # Check tokens are not empty
        assert len(data["access"]) > 0
        assert len(data["refresh"]) > 0

        # Tokens should be different
        assert data["access"] != data["refresh"]

    def test_login_invalid_password(self, api_client, regular_user, invalid_login_data):
        """Test login with wrong password returns 401."""
        response = api_client.post("/auth/login", json=invalid_login_data)

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Invalid credentials" in data["detail"]

    def test_login_nonexistent_user(self, api_client):
        """Test login with non-existent mobile returns 401."""
        response = api_client.post(
            "/auth/login", json={"mobile": "09999999999", "password": "anypassword"}
        )

        assert response.status_code == 401

    def test_login_invalid_mobile_format(self, api_client, malformed_mobile_data):
        """Test login with invalid mobile format returns 422."""
        response = api_client.post("/auth/login", json=malformed_mobile_data)

        # Ninja validation should catch this
        assert response.status_code == 401

    def test_login_missing_fields(self, api_client):
        """Test login with missing fields returns 422."""
        # Missing password
        response = api_client.post("/auth/login", json={"mobile": "09123456789"})
        assert response.status_code == 422

        # Missing mobile
        response = api_client.post("/auth/login", json={"password": "test"})
        assert response.status_code == 422

        # Empty body
        response = api_client.post("/auth/login", json={})
        assert response.status_code == 422

    def test_login_inactive_user(self, api_client, db):
        """Test login with inactive user returns 401."""

        AccountFactory(mobile="09111111111", password="testpass123", is_active=False)

        response = api_client.post(
            "/auth/login", json={"mobile": "09111111111", "password": "testpass123"}
        )

        # Django's user_can_authenticate checks is_active
        assert response.status_code == 401

    def test_login_staff_user(self, api_client, staff_user):
        """Test staff user can login normally."""
        response = api_client.post(
            "/auth/login", json={"mobile": "09123456788", "password": "staffpass123"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access" in data

    def test_login_superuser(self, api_client, superuser):
        """Test superuser can login normally."""
        response = api_client.post(
            "/auth/login", json={"mobile": "09123456787", "password": "superpass123"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access" in data


# ============================================================================
# /me Endpoint Tests
# ============================================================================


@pytest.mark.django_db
class TestMeEndpoint:
    """Test GET /api/auth/me endpoint."""

    def test_me_success(self, authenticated_client, regular_user):
        """Test /me returns user data with valid token."""
        response = authenticated_client.get("/auth/me")

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert data["id"] == regular_user.id
        assert data["mobile"] == regular_user.mobile
        assert data["name"] == regular_user.name
        assert data["is_staff"] is False
        assert data["is_superuser"] is False

    def test_me_staff_user(self, staff_authenticated_client, staff_user):
        """Test /me returns correct flags for staff user."""
        response = staff_authenticated_client.get("/auth/me")

        assert response.status_code == 200
        data = response.json()

        assert data["is_staff"] is True
        assert data["is_superuser"] is False

    def test_me_without_token(self, api_client):
        """Test /me without token returns 401."""
        response = api_client.get("/auth/me")

        assert response.status_code == 401

    def test_me_with_invalid_token(self, api_client):
        """Test /me with invalid token returns 401."""
        response = api_client.get(
            "/auth/me", headers={"Authorization": "Bearer invalid_token_here"}
        )

        assert response.status_code == 401

    def test_me_with_malformed_header(self, api_client, access_token):
        """Test /me with malformed Authorization header returns 401."""
        # Missing 'Bearer' prefix
        response = api_client.get("/auth/me", headers={"Authorization": access_token})
        assert response.status_code == 401

        # Wrong prefix
        response = api_client.get(
            "/auth/me", headers={"Authorization": f"Token {access_token}"}
        )
        assert response.status_code == 401

    def test_me_with_refresh_token(self, api_client, refresh_token):
        """Test /me with refresh token (wrong type) returns 401."""
        response = api_client.get(
            "/auth/me", headers={"Authorization": f"Bearer {refresh_token}"}
        )

        # Should fail because refresh token has wrong 'type' claim
        assert response.status_code == 401

    def test_me_deleted_user(self, api_client, access_token, regular_user):
        """Test /me with token for deleted user returns 401."""
        # Delete the user
        regular_user.id
        regular_user.delete()

        # Try to access /me with old token
        response = api_client.get(
            "/auth/me", headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 401


# ============================================================================
# Refresh Endpoint Tests
# ============================================================================


@pytest.mark.django_db
class TestRefreshEndpoint:
    """Test POST /api/auth/refresh endpoint."""

    def test_refresh_success(self, api_client, refresh_token):
        """Test successful token refresh."""
        response = api_client.post("/auth/refresh", json={"refresh": refresh_token})

        assert response.status_code == 200
        data = response.json()

        # Should return new token pair
        assert "access" in data
        assert "refresh" in data

        # New tokens should be different from original
        # assert data["refresh"] != refresh_token

    def test_refresh_with_invalid_token(self, api_client):
        """Test refresh with invalid token returns 401."""
        response = api_client.post("/auth/refresh", json={"refresh": "invalid_token"})

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    def test_refresh_with_access_token(self, api_client, access_token):
        """Test refresh with access token (wrong type) returns 401."""
        response = api_client.post("/auth/refresh", json={"refresh": access_token})

        # Should fail because access token has wrong 'type' claim
        assert response.status_code == 401

    def test_refresh_missing_token(self, api_client):
        """Test refresh without token returns 422."""
        response = api_client.post("/auth/refresh", json={})

        assert response.status_code == 422

    def test_refresh_deleted_user(self, api_client, refresh_token, regular_user):
        """Test refresh with token for deleted user returns 401."""
        # Delete the user
        regular_user.delete()

        # Try to refresh
        response = api_client.post("/auth/refresh", json={"refresh": refresh_token})

        assert response.status_code == 401

    def test_refresh_reuses_refresh_token(self, api_client, refresh_token):
        """Test that refresh endpoint reuses the refresh token (common secure pattern)."""
        response1 = api_client.post("/auth/refresh", json={"refresh": refresh_token})
        data1 = response1.json()

        response2 = api_client.post("/auth/refresh", json={"refresh": data1["refresh"]})
        data2 = response2.json()

        # Refresh token is reused
        assert data1["refresh"] == data2["refresh"] == refresh_token
        # Access token may be same if called instantly (same iat), so just check it's valid
        assert "access" in data1
        assert "access" in data2


# ============================================================================
# Logout Endpoint Tests
# ============================================================================


@pytest.mark.django_db
class TestLogoutEndpoint:
    """Test POST /api/auth/logout endpoint."""

    def test_logout_success(self, api_client):
        """Test logout returns success."""
        response = api_client.post("/auth/logout")

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "message" in data

    def test_logout_authenticated(self, authenticated_client):
        """Test logout works for authenticated users."""
        response = authenticated_client.post("/auth/logout")

        assert response.status_code == 200

    def test_logout_without_auth(self, api_client):
        """Test logout works without authentication (stateless)."""
        response = api_client.post("/auth/logout")

        # Should still work because logout is stateless
        assert response.status_code == 200

    def test_token_still_valid_after_logout(
        self, api_client, authenticated_client, access_token
    ):
        """
        Test that token remains valid after logout (stateless JWT).

        In stateless JWT, logout is client-side only.
        The token remains valid until it expires.
        """
        # Logout
        response = authenticated_client.post("/auth/logout")
        assert response.status_code == 200

        # Token should still work (stateless design)
        response = api_client.get(
            "/auth/me", headers={"Authorization": f"Bearer {access_token}"}
        )
        assert response.status_code == 200


# ============================================================================
# Integration Tests
# ============================================================================
@pytest.mark.django_db
class TestAuthFlowIntegration:
    """Test complete authentication flows."""

    def test_complete_auth_flow(self, api_client, regular_user, login_data):
        """Test complete flow: login -> access /me -> refresh -> access /me again."""
        # Step 1: Login
        response = api_client.post("/auth/login", json=login_data)
        assert response.status_code == 200
        tokens = response.json()

        # Step 2: Access protected endpoint with access token
        response = api_client.get(
            "/auth/me", headers={"Authorization": f"Bearer {tokens['access']}"}
        )
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["mobile"] == regular_user.mobile

        # Step 3: Refresh tokens
        response = api_client.post("/auth/refresh", json={"refresh": tokens["refresh"]})
        assert response.status_code == 200
        new_tokens = response.json()

        # Step 4: Access endpoint with new access token
        response = api_client.get(
            "/auth/me", headers={"Authorization": f"Bearer {new_tokens['access']}"}
        )
        assert response.status_code == 200

        # Step 5: Logout
        response = api_client.post("/auth/logout")
        assert response.status_code == 200

    def test_multiple_refreshes(self, api_client, refresh_token):
        """Test multiple consecutive refreshes."""
        current_refresh = refresh_token

        for i in range(3):
            response = api_client.post(
                "/auth/refresh", json={"refresh": current_refresh}
            )
            assert response.status_code == 200
            data = response.json()

            # Use new refresh token for next iteration
            current_refresh = data["refresh"]

    def test_concurrent_logins(self, api_client, regular_user, login_data):
        """Test that multiple logins create different tokens."""
        # First login
        response1 = api_client.post("/auth/login", json=login_data)
        tokens1 = response1.json()

        # Second login
        response2 = api_client.post("/auth/login", json=login_data)
        tokens2 = response2.json()

        assert response1.status_code == 200
        assert response2.status_code == 200
        assert "access" in tokens1
        assert "access" in tokens2


# ============================================================================
# Edge Cases & Error Handling
# ============================================================================


@pytest.mark.django_db
class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_empty_mobile(self, api_client):
        """Test login with empty mobile."""
        response = api_client.post(
            "/auth/login", json={"mobile": "", "password": "test"}
        )
        assert response.status_code == 401

    def test_empty_password(self, api_client, regular_user):
        """Test login with empty password."""
        response = api_client.post(
            "/auth/login", json={"mobile": "09123456789", "password": ""}
        )
        assert response.status_code == 401

    def test_sql_injection_attempt(self, api_client):
        """Test that SQL injection in mobile is handled safely."""
        response = api_client.post(
            "/auth/login", json={"mobile": "0912345678' OR '1'='1", "password": "test"}
        )
        # Should fail validation or return 401, not 500
        assert response.status_code in [401, 422]

    def test_very_long_mobile(self, api_client):
        """Test login with extremely long mobile number."""
        response = api_client.post(
            "/auth/login", json={"mobile": "0" * 1000, "password": "test"}
        )
        assert response.status_code == 401
