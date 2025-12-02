"""
Menu and Sale Permissions

This module defines custom permissions for menu and sale operations.

"""

from django.db import models
from django.utils.translation import gettext_lazy as _


class SalePermissions(models.Model):
    """
    Container for sale operation permissions.

    This is NOT a real model - no database table created.
    Used only to group related permissions.

    Permissions for:
        - Viewing sale items
        - Creating invoices
        - Managing invoices
        - Discounts and refunds
    """

    class Meta:
        managed = False  # Don't create database table
        default_permissions = ()  # Don't auto-create add/change/delete/view

        permissions = [
            # Viewing items
            ("view_sale_items", _("Can view items for sale")),
            # Invoice operations
            ("create_invoice", _("Can create sale invoice")),
            ("view_own_invoices", _("Can view own invoices")),
            ("view_all_invoices", _("Can view all invoices")),
            ("edit_invoice", _("Can edit pending invoice")),
            ("delete_invoice", _("Can delete invoice")),
            ("void_invoice", _("Can void completed invoice")),
            # Payment operations
            ("accept_cash_payment", _("Can accept cash payment")),
            ("accept_card_payment", _("Can accept card payment")),
            ("process_refund", _("Can process refund")),
            # Pricing
            ("apply_discount", _("Can apply discount to invoice")),
            ("override_price", _("Can override item price")),
            ("view_item_cost", _("Can view item cost/margin")),
            # Reports
            ("view_daily_sales", _("Can view daily sales summary")),
            ("view_sales_reports", _("Can view detailed sales reports")),
            ("export_sales_data", _("Can export sales data")),
        ]


class KitchenPermissions(models.Model):
    """
    Container for kitchen operation permissions.

    Permissions for:
        - Viewing orders
        - Managing order status
        - Kitchen display system
    """

    class Meta:
        managed = False
        default_permissions = ()

        permissions = [
            # Order viewing
            ("view_kitchen_orders", _("Can view kitchen orders")),
            ("view_all_orders", _("Can view all orders (not just assigned)")),
            # Order management
            ("mark_order_ready", _("Can mark order as ready")),
            ("mark_order_delivered", _("Can mark order as delivered")),
            ("cancel_order", _("Can cancel kitchen order")),
            ("modify_order", _("Can modify order items/notes")),
            # Priority management
            ("set_order_priority", _("Can set order priority")),
            ("rush_order", _("Can mark order as rush")),
        ]
