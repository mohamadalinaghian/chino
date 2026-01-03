"""
Thermal printer integration for TPB0BE printers.
Prints sale orders to network printers.
"""

import logging
from datetime import datetime
from typing import Optional

from apps.sale.models import Sale
from django.conf import settings

logger = logging.getLogger(__name__)

# Printer configuration
PRINTER_IPS = getattr(settings, 'THERMAL_PRINTERS', [
    '192.168.1.125',
    '192.168.1.126',
])


def print_sale_order(sale: Sale, printer_ip: Optional[str] = None) -> bool:
    """
    Print sale order to thermal printer.

    Args:
        sale: Sale instance to print
        printer_ip: Specific printer IP to use (optional, uses first available if not specified)

    Returns:
        bool: True if print succeeded, False otherwise
    """
    try:
        from escpos.printer import Network
        from escpos.exceptions import Error as EscposError
    except ImportError:
        logger.error("python-escpos not installed. Install with: pip install python-escpos")
        return False

    # Use specified printer or first available
    target_ip = printer_ip or PRINTER_IPS[0]

    try:
        # Connect to network printer
        printer = Network(target_ip)

        # Print header
        printer.set(align='center', text_type='B', width=2, height=2)
        printer.text("CHINO CAFE\n")
        printer.set(align='center', text_type='normal', width=1, height=1)
        printer.text(f"{datetime.now().strftime('%Y/%m/%d %H:%M')}\n")
        printer.text("=" * 32 + "\n")

        # Sale type and table/takeaway info
        printer.set(align='center', text_type='B')
        if sale.sale_type == Sale.SaleType.DINE_IN and sale.table:
            printer.text(f"Table: {sale.table.name}\n")
        else:
            printer.text("TAKEAWAY\n")
        printer.set(align='left', text_type='normal')

        printer.text(f"Order #{sale.id}\n")
        if sale.guest:
            printer.text(f"Guest: {sale.guest.get_full_name()}\n")
        if sale.guest_count:
            printer.text(f"Guests: {sale.guest_count}\n")

        printer.text("=" * 32 + "\n")

        # Items
        printer.set(align='left', text_type='B')
        printer.text("ITEMS:\n")
        printer.set(align='left', text_type='normal')

        for item in sale.items.filter(parent_item__isnull=True).select_related('product'):
            # Main item
            qty = item.quantity
            name = item.product.name if item.product else "Unknown"
            price = item.unit_price
            total = item.total_price

            # Format: "2x Espresso.............. 50,000"
            line = f"{qty}x {name}"
            spaces = 32 - len(line) - len(f"{total:,}")
            printer.text(f"{line}{' ' * spaces}{total:,}\n")

            # Extras (child items)
            extras = sale.items.filter(parent_item=item).select_related('product')
            for extra in extras:
                extra_name = extra.product.name if extra.product else "Unknown"
                extra_qty = extra.quantity
                extra_total = extra.total_price

                line = f"  + {extra_name} x{extra_qty}"
                spaces = 32 - len(line) - len(f"{extra_total:,}")
                printer.text(f"{line}{' ' * spaces}{extra_total:,}\n")

        printer.text("=" * 32 + "\n")

        # Totals
        printer.set(align='right', text_type='B')
        printer.text(f"Subtotal: {sale.subtotal_amount:,}\n")
        if sale.discount_amount > 0:
            printer.text(f"Discount: -{sale.discount_amount:,}\n")
        if sale.tax_amount > 0:
            printer.text(f"Tax: {sale.tax_amount:,}\n")

        printer.set(align='right', text_type='B', width=2, height=2)
        printer.text(f"TOTAL: {sale.total_amount:,}\n")

        printer.set(align='left', text_type='normal', width=1, height=1)
        printer.text("=" * 32 + "\n")

        # Note
        if sale.note:
            printer.set(align='left', text_type='normal')
            printer.text(f"Note: {sale.note}\n")
            printer.text("-" * 32 + "\n")

        # Footer
        printer.set(align='center', text_type='normal')
        printer.text("\nThank you!\n")
        printer.text("Enjoy your meal\n\n")

        # Cut paper
        printer.cut()

        logger.info(f"Successfully printed sale #{sale.id} to printer {target_ip}")
        return True

    except EscposError as e:
        logger.error(f"Printer error for sale #{sale.id}: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error printing sale #{sale.id}: {e}")
        return False


def print_to_all_printers(sale: Sale) -> dict:
    """
    Print to all configured printers.

    Returns:
        dict: {printer_ip: success_bool}
    """
    results = {}
    for printer_ip in PRINTER_IPS:
        success = print_sale_order(sale, printer_ip)
        results[printer_ip] = success
    return results
