from decimal import Decimal


def format_number(value: Decimal) -> str:
    """
    Format number with thousand separators and remove trailing .00 if unnecessary.
    Example: 12345.00 -> '12,345' | 12345.50 -> '12,345.5'
    """
    if value is None:
        return ""
    value = value.normalize()
    if value == value.to_integral_value():
        return f"{value:,.0f}"
    return f"{value:,}"  # auto trim extra zeros
