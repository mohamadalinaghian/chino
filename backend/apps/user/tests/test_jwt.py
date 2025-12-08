# apps/user/tests/test_jwt.py
"""
Tests for JWT token creation and validation.

Tests JWT utility functions from api/security/auth.py
"""

from datetime import datetime, timedelta, timezone

import jwt as pyjwt
import pytest
from api.security.auth import (
    JWTError,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_user_from_payload,
)
from django.conf import settings


@pytest.mark.django_db
class TestTokenCreation:
    """Test JWT token creation functions."""

    def test_create_access_token(self, regular_user):
        """Test creating an access token."""
        token = create_access_token(regular_user)

        # Should return a string
        assert isinstance(token, str)
        assert len(token) > 0

        # Should have 3 parts (header.payload.signature)
        assert token.count(".") == 2

    def test_create_refresh_token(self, regular_user):
        """Test creating a refresh token."""
        token = create_refresh_token(regular_user)

        assert isinstance(token, str)
        assert len(token) > 0
        assert token.count(".") == 2

    def test_access_and_refresh_tokens_differ(self, regular_user):
        """Test that access and refresh tokens are different."""
        access = create_access_token(regular_user)
        refresh = create_refresh_token(regular_user)

        assert access != refresh

    def test_access_token_payload_structure(self, regular_user):
        """Test access token contains correct claims."""
        token = create_access_token(regular_user)

        # Decode without verification to inspect payload
        payload = pyjwt.decode(token, options={"verify_signature": False})

        # Check required claims
        assert "sub" in payload
        assert "iat" in payload
        assert "exp" in payload
        assert "type" in payload

        # Check values
        assert payload["sub"] == str(regular_user.pk)
        assert payload["type"] == "access"

        # Check expiration is set correctly (15 minutes)
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        iat = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)
        diff = exp - iat

        # Should be approximately JWT_ACCESS_TTL
        expected = settings.JWT_ACCESS_TTL.total_seconds()
        assert abs(diff.total_seconds() - expected) < 2  # Within 2 seconds

    def test_refresh_token_payload_structure(self, regular_user):
        """Test refresh token contains correct claims."""
        token = create_refresh_token(regular_user)

        payload = pyjwt.decode(token, options={"verify_signature": False})

        assert payload["sub"] == str(regular_user.pk)
        assert payload["type"] == "refresh"

        # Check expiration is set correctly (7 hours)
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        iat = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)
        diff = exp - iat

        expected = settings.JWT_REFRESH_TTL.total_seconds()
        assert abs(diff.total_seconds() - expected) < 2

    def test_tokens_for_different_users_differ(self, regular_user, staff_user):
        """Test tokens for different users are different."""
        token1 = create_access_token(regular_user)
        token2 = create_access_token(staff_user)

        assert token1 != token2

    def test_consecutive_tokens_differ(self, regular_user):
        """Test consecutive tokens for same user differ (due to iat)."""
        import time

        token1 = create_access_token(regular_user)
        time.sleep(1)  # Wait 1 second
        token2 = create_access_token(regular_user)

        # Should be different because iat differs
        assert token1 != token2


@pytest.mark.django_db
class TestTokenDecoding:
    """Test JWT token decoding and validation."""

    def test_decode_valid_access_token(self, access_token):
        """Test decoding a valid access token."""
        payload = decode_token(access_token, expected_type="access")

        assert "sub" in payload
        assert "iat" in payload
        assert "exp" in payload
        assert payload["type"] == "access"

    def test_decode_valid_refresh_token(self, refresh_token):
        """Test decoding a valid refresh token."""
        payload = decode_token(refresh_token, expected_type="refresh")

        assert payload["type"] == "refresh"

    def test_decode_without_type_check(self, access_token):
        """Test decoding without checking token type."""
        payload = decode_token(access_token)

        assert "sub" in payload
        # Should succeed even without type check

    def test_decode_with_wrong_type(self, access_token):
        """Test decoding access token as refresh fails."""
        with pytest.raises(JWTError) as exc_info:
            decode_token(access_token, expected_type="refresh")

        assert "invalid_token" in str(exc_info.value)

    def test_decode_invalid_token(self):
        """Test decoding invalid token raises JWTError."""
        with pytest.raises(JWTError) as exc_info:
            decode_token("invalid.token.here")

        assert "invalid_token" in str(exc_info.value)

    def test_decode_expired_token(self, regular_user):
        """Test decoding expired token raises JWTError."""
        # Create token that's already expired
        now = datetime.now(tz=timezone.utc)
        exp = now - timedelta(minutes=1)  # Expired 1 minute ago

        payload = {
            "sub": str(regular_user.pk),
            "iat": int(now.timestamp()),
            "exp": int(exp.timestamp()),
            "type": "access",
        }

        expired_token = pyjwt.encode(
            payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
        )

        with pytest.raises(JWTError) as exc_info:
            decode_token(expired_token)

        assert "token_expired" in str(exc_info.value)

    def test_decode_token_with_wrong_secret(self, access_token):
        """Test that token signed with different secret fails."""
        # Try to decode with wrong secret by creating a token with wrong secret
        payload = {"sub": "1", "iat": 123, "exp": 456, "type": "access"}
        wrong_token = pyjwt.encode(payload, "wrong_secret", algorithm="HS256")

        with pytest.raises(JWTError):
            decode_token(wrong_token)

    def test_decode_token_missing_required_claims(self, regular_user):
        """Test decoding token without required claims fails."""
        # Token without 'sub'
        payload = {
            "iat": int(datetime.now(tz=timezone.utc).timestamp()),
            "exp": int(
                (datetime.now(tz=timezone.utc) + timedelta(hours=1)).timestamp()
            ),
        }

        token = pyjwt.encode(
            payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
        )

        with pytest.raises(JWTError):
            decode_token(token)


@pytest.mark.django_db
class TestGetUserFromPayload:
    """Test extracting user from token payload."""

    def test_get_user_from_valid_payload(self, regular_user):
        """Test getting user from valid payload."""
        payload = {"sub": str(regular_user.pk)}

        user = get_user_from_payload(payload)

        assert user.id == regular_user.id
        assert user.mobile == regular_user.mobile

    def test_get_user_from_nonexistent_id(self, db):
        """Test getting non-existent user raises JWTError."""
        payload = {"sub": "99999"}

        with pytest.raises(JWTError) as exc_info:
            get_user_from_payload(payload)

        assert "user_not_found" in str(exc_info.value)

    def test_get_user_with_invalid_sub_format(self, db):
        """Test invalid sub format raises JWTError."""
        payload = {"sub": "not_a_number"}

        with pytest.raises(JWTError) as exc_info:
            get_user_from_payload(payload)

        assert "invalid_sub" in str(exc_info.value)

    def test_get_user_with_negative_id(self, db):
        """Test negative user ID raises JWTError."""
        payload = {"sub": "-1"}

        with pytest.raises(JWTError):
            get_user_from_payload(payload)

    def test_get_user_with_zero_id(self, db):
        """Test zero user ID raises JWTError."""
        payload = {"sub": "0"}

        with pytest.raises(JWTError):
            get_user_from_payload(payload)


@pytest.mark.django_db
class TestTokenExpiration:
    """Test token expiration behavior."""

    def test_access_token_expires_after_ttl(self, regular_user):
        """Test that access token expires after JWT_ACCESS_TTL."""
        token = create_access_token(regular_user)

        # Decode to check expiration
        payload = pyjwt.decode(token, options={"verify_signature": False})

        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(tz=timezone.utc)

        # Should expire in the future
        assert exp > now

        # Should expire within JWT_ACCESS_TTL + 1 second (for timing variance)
        max_exp = now + settings.JWT_ACCESS_TTL + timedelta(seconds=1)
        assert exp <= max_exp

    def test_refresh_token_expires_after_ttl(self, regular_user):
        """Test that refresh token expires after JWT_REFRESH_TTL."""
        token = create_refresh_token(regular_user)

        payload = pyjwt.decode(token, options={"verify_signature": False})

        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(tz=timezone.utc)

        assert exp > now

        max_exp = now + settings.JWT_REFRESH_TTL + timedelta(seconds=1)
        assert exp <= max_exp

    def test_token_valid_immediately_after_creation(self, regular_user):
        """Test token is valid immediately after creation."""
        token = create_access_token(regular_user)

        # Should decode successfully
        payload = decode_token(token, expected_type="access")
        assert payload is not None


@pytest.mark.django_db
class TestJWTSecurity:
    """Test JWT security features."""

    def test_token_cannot_be_modified(self, access_token):
        """Test that modifying token invalidates signature."""
        # Split token
        parts = access_token.split(".")

        # Modify payload (middle part)
        # Just change one character
        modified_payload = parts[1][:-1] + "X"
        modified_token = f"{parts[0]}.{modified_payload}.{parts[2]}"

        # Should fail to decode
        with pytest.raises(JWTError):
            decode_token(modified_token)

    def test_signature_verification(self, regular_user):
        """Test that signature is properly verified."""
        # Create token with wrong algorithm
        payload = {
            "sub": str(regular_user.pk),
            "iat": int(datetime.now(tz=timezone.utc).timestamp()),
            "exp": int(
                (datetime.now(tz=timezone.utc) + timedelta(hours=1)).timestamp()
            ),
            "type": "access",
        }

        # Sign with different algorithm
        token = pyjwt.encode(payload, settings.JWT_SECRET, algorithm="HS512")

        # Should fail because algorithm doesn't match
        with pytest.raises(JWTError):
            decode_token(token)

    def test_token_includes_issued_at(self, access_token):
        """Test token includes iat (issued at) claim."""
        payload = pyjwt.decode(access_token, options={"verify_signature": False})

        assert "iat" in payload

        # iat should be recent (within last minute)
        iat = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)
        now = datetime.now(tz=timezone.utc)

        assert (now - iat).total_seconds() < 60


@pytest.mark.django_db
class TestTokenEdgeCases:
    """Test edge cases in token handling."""

    def test_token_with_none_values(self):
        """Test handling of None values in token functions."""
        with pytest.raises((TypeError, AttributeError)):
            create_access_token(None)

    def test_empty_string_token(self):
        """Test decoding empty string token."""
        with pytest.raises(JWTError):
            decode_token("")

    def test_token_with_extra_claims(self, regular_user):
        """Test token with extra custom claims."""
        now = datetime.now(tz=timezone.utc)
        payload = {
            "sub": str(regular_user.pk),
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=1)).timestamp()),
            "type": "access",
            "custom_claim": "custom_value",  # Extra claim
        }

        token = pyjwt.encode(
            payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
        )

        # Should decode successfully (extra claims are ignored)
        result = decode_token(token, expected_type="access")
        assert result["custom_claim"] == "custom_value"

    def test_very_long_token(self, regular_user):
        """Test handling of very long tokens."""
        # Create token with very long sub
        now = datetime.now(tz=timezone.utc)
        payload = {
            "sub": "x" * 10000,  # Very long sub
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=1)).timestamp()),
            "type": "access",
        }

        token = pyjwt.encode(
            payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
        )

        # Should decode but fail to get user
        decoded = decode_token(token)
        assert decoded is not None

        with pytest.raises(JWTError):
            get_user_from_payload(decoded)
