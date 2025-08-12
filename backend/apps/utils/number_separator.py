from decimal import Decimal


def format_number(value: Decimal) -> str:
    """
    Format a Decimal number with thousand separators.
    Omit decimal part if it's zero (cleaner presentation).
    """
    val = value.normalize()
    formatted = f"{val:,.2f}"

    return str(formatted)
