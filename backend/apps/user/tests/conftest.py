# apps/user/tests/conftest.py
"""
Pytest fixtures for authentication tests.

This file contains reusable fixtures for testing auth functionality.
"""

import os

import pytest
from api.security.auth import create_access_token, create_refresh_token
from apps.user.tests.factories import AccountFactory
from django.contrib.auth import get_user_model
from django.test import Client
from ninja.testing import TestClient

os.environ["NINJA_SKIP_REGISTRY"] = "1"

User = get_user_model()


# ============================================================================
# Database Fixtures
# ============================================================================


@pytest.fixture
def db_setup(db):
    """
    Ensure database is set up for tests.

    The 'db' fixture from pytest-django is included as a dependency.
    """
    pass


# ============================================================================
# Client Fixtures
# ============================================================================


@pytest.fixture
def api_client():
    """
    Ninja API test client.

    Usage:
        def test_endpoint(api_client):
            response = api_client.post("/auth/login", json={...})
            assert response.status_code == 200
    """
    from api.router import api

    return TestClient(api)


@pytest.fixture
def django_client():
    """
    Django test client (for non-API tests).

    Usage:
        def test_page(django_client):
            response = django_client.get("/admin/")
            assert response.status_code == 200
    """
    return Client()


# ============================================================================
# User Fixtures
# ============================================================================


@pytest.fixture
def regular_user(db):
    """
    Create a regular user with known credentials.

    Mobile: 09123456789
    Password: testpass123

    Usage:
        def test_something(regular_user):
            assert regular_user.mobile == '09123456789'
    """
    return AccountFactory(
        mobile="09123456789", name="Test User", password="testpass123"
    )


@pytest.fixture
def staff_user(db):
    """
    Create a staff user.

    Mobile: 09123456788
    Password: staffpass123

    Usage:
        def test_staff_access(staff_user):
            assert staff_user.is_staff is True
    """
    return AccountFactory(
        mobile="09123456788", name="Staff User", password="staffpass123", is_staff=True
    )


@pytest.fixture
def superuser(db):
    """
    Create a superuser.

    Mobile: 09123456787
    Password: superpass123

    Usage:
        def test_admin_access(superuser):
            assert superuser.is_superuser is True
    """
    return AccountFactory(
        mobile="09123456787",
        name="Super User",
        password="superpass123",
        is_staff=True,
        is_superuser=True,
    )


@pytest.fixture
def multiple_users(db):
    """
    Create multiple test users.

    Returns list of 5 users with sequential mobile numbers.

    Usage:
        def test_multiple(multiple_users):
            assert len(multiple_users) == 5
    """
    return AccountFactory.create_batch(5)


# ============================================================================
# Token Fixtures
# ============================================================================


@pytest.fixture
def access_token(regular_user):
    """
    Generate access token for regular_user.

    Usage:
        def test_protected_endpoint(api_client, access_token):
            response = api_client.get(
                "/auth/me",
                headers={"Authorization": f"Bearer {access_token}"}
            )
    """
    return create_access_token(regular_user)


@pytest.fixture
def refresh_token(regular_user):
    """
    Generate refresh token for regular_user.

    Usage:
        def test_refresh(api_client, refresh_token):
            response = api_client.post("/auth/refresh", json={"refresh": refresh_token})
    """
    return create_refresh_token(regular_user)


@pytest.fixture
def staff_access_token(staff_user):
    """
    Generate access token for staff user.

    Usage:
        def test_staff_endpoint(api_client, staff_access_token):
            response = api_client.get(
                "/staff-only",
                headers={"Authorization": f"Bearer {staff_access_token}"}
            )
    """
    return create_access_token(staff_user)


@pytest.fixture
def token_pair(regular_user):
    """
    Generate both access and refresh tokens.

    Returns dict with 'access' and 'refresh' keys.

    Usage:
        def test_tokens(token_pair):
            assert 'access' in token_pair
            assert 'refresh' in token_pair
    """
    return {
        "access": create_access_token(regular_user),
        "refresh": create_refresh_token(regular_user),
    }


# ============================================================================
# Authenticated Client Fixtures
# ============================================================================


@pytest.fixture
def authenticated_client(api_client, access_token):
    """
    API client with authentication header pre-configured.

    Usage:
        def test_me_endpoint(authenticated_client):
            response = authenticated_client.get("/auth/me")
            assert response.status_code == 200
    """
    client = api_client
    client.headers.update({"Authorization": f"Bearer {access_token}"})
    return client


@pytest.fixture
def staff_authenticated_client(api_client, staff_access_token):
    """
    API client authenticated as staff user.

    Usage:
        def test_staff_endpoint(staff_authenticated_client):
            response = staff_authenticated_client.get("/staff-only")
    """
    api_client.headers = {"Authorization": f"Bearer {staff_access_token}"}
    return api_client


# ============================================================================
# Utility Fixtures
# ============================================================================


@pytest.fixture
def login_data():
    """
    Valid login credentials matching regular_user.

    Usage:
        def test_login(api_client, regular_user, login_data):
            response = api_client.post("/auth/login", json=login_data)
    """
    return {"mobile": "09123456789", "password": "testpass123"}


@pytest.fixture
def invalid_login_data():
    """
    Invalid login credentials for testing failures.

    Usage:
        def test_invalid_login(api_client, invalid_login_data):
            response = api_client.post("/auth/login", json=invalid_login_data)
            assert response.status_code == 401
    """
    return {"mobile": "09123456789", "password": "wrongpassword"}


@pytest.fixture
def malformed_mobile_data():
    """
    Login data with invalid mobile format.

    Usage:
        def test_mobile_validation(api_client, malformed_mobile_data):
            response = api_client.post("/auth/login", json=malformed_mobile_data)
            assert response.status_code == 422
    """
    return {
        "mobile": "1234567890",  # Invalid format
        "password": "testpass123",
    }
