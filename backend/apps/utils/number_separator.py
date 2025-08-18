from decimal import Decimal, InvalidOperation


def format_number(value) -> str:
    """
    Format Decimal/number with thousands separators and remove trailing zeros.
    Examples:
        12345.00  -> "12,345"
        12345.50  -> "12,345.5"
        12345.123 -> "12,345.123"
    Returns empty string for None or invalid input.
    """
    if value is None:
        return ""

    try:
        v = Decimal(value)
    except (InvalidOperation, TypeError):
        return str(value)

    # use 'f' to avoid scientific notation; normalize then strip trailing zeros/dot
    s = format(v.normalize(), "f")
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    # split integer and fraction
    int_part, frac_part = s.split(".", 1) if "." in s else (s, None)
    # add thousands separator to integer part (english commas)
    try:
        int_part_with_sep = "{:,}".format(int(int_part))
    except Exception:
        # fallback if int conversion fails
        int_part_with_sep = int_part

    return f"{int_part_with_sep}.{frac_part}" if frac_part else int_part_with_sep
