import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_iran_card_number(value):
    """
    Validate Iranian bank card numbers.
    - Normalizes Persian/Arabic digits
    - Removes separators/spaces
    - Ensures 16 digits
    - Performs Luhn algorithm check
    """

    if value is None:
        raise ValidationError(_("Card number cannot be empty."))

    # Normalize digits (convert Persian/Arabic numerals and strip spaces/dashes)
    persian_to_latin = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹", "01234567890123456789")
    s = str(value).strip().translate(persian_to_latin)
    s = re.sub(r"\D+", "", s)  # remove any non-digit

    if not s:
        raise ValidationError(_("Card number cannot be empty."))

    # Ensure correct length
    if not re.fullmatch(r"\d{16}", s):
        raise ValidationError(_("Card number must contain exactly 16 digits."))

    # Perform Luhn check
    if not _luhn_check(s):
        raise ValidationError(_("Invalid Iranian card number."))


def _luhn_check(number: str) -> bool:
    """Validate using the Luhn algorithm."""
    total = 0
    reverse_digits = number[::-1]
    for i, ch in enumerate(reverse_digits):
        d = ord(ch) - 48
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0
