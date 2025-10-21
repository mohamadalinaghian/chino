import pytest
from apps.utils.validators import IranianCardNumberValidator
from django.core.exceptions import ValidationError

validator = IranianCardNumberValidator()


# ---------- Helpers ----------
def _valid_sample_card():
    # A known valid Iranian card number that passes the Luhn check.
    # Example only (not tied to any real account).
    return "6037991012345678"


# ---------- Tests ----------


def test_valid_card_number():
    """Should accept a correct 16-digit Iranian card number."""
    card = _valid_sample_card()
    validator(card)  # No exception expected


def test_card_with_spaces_and_dashes():
    """Should normalize and accept numbers with spaces or dashes."""
    card = "6037 9910-1234 5678"
    validator(card)  # No exception expected


def test_persian_digits_are_accepted():
    """Should normalize Persian/Arabic digits."""
    persian_card = "۶۰۳۷۹۹۱۰۱۲۳۴۵۶۷۸"
    validator(persian_card)  # No exception expected


def test_invalid_card_length():
    """Should reject cards shorter or longer than 16 digits."""
    with pytest.raises(ValidationError, match="16 digits"):
        validator("1234")

    with pytest.raises(ValidationError, match="16 digits"):
        validator("60379910123456789012")


def test_invalid_card_luhn():
    """Should reject incorrect Luhn checksum."""
    bad_card = "6037991012345679"  # One digit changed
    with pytest.raises(ValidationError, match="Invalid Iranian card number"):
        validator(bad_card)


def test_empty_value_raises_error():
    """Should reject empty or None values."""
    with pytest.raises(ValidationError, match="cannot be empty"):
        validator("")
    with pytest.raises(ValidationError, match="cannot be empty"):
        validator(None)
