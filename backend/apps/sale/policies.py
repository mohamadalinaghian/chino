"""
Authorization policies for Sale operations.
Each policy encapsulates permission checks and business rules.
"""

from django.core.exceptions import PermissionDenied
from django.utils.translation import gettext_lazy as _

from .models import Sale


def _require_authenticated(user) -> None:
    """
    Ensures user is authenticated before proceeding with any operation.

    Args:
        user: Django User instance

    Raises:
        PermissionDenied: If user is not authenticated
    """
    if not user or not user.is_authenticated:
        raise PermissionDenied(_("Authentication required"))


def can_open_sale(user) -> None:
    """
    Validates user permission to create a new sale.

    Args:
        user: Django User instance

    Raises:
        PermissionDenied: If user lacks 'sale.open_sale' permission
    """
    _require_authenticated(user)

    if not user.has_perm("sale.open_sale"):
        raise PermissionDenied(_("You are not allowed to open a sale"))


def can_see_sale_details(user) -> None:
    """
    Validates user permission to view detailed sale information.

    Args:
        user: Django User instance

    Raises:
        PermissionDenied: If user lacks 'sale.view_sale_detail' permission
    """
    _require_authenticated(user)

    if not user.has_perm("sale.view_sale_detail"):
        raise PermissionDenied(_("You are not allowed to see sale details"))


def can_see_sale_list(user) -> None:
    """
    Validates user permission to view the sales dashboard/list.

    Args:
        user: Django User instance

    Raises:
        PermissionDenied: If user lacks 'sale.view_sale_list' permission
    """
    _require_authenticated(user)

    if not user.has_perm("sale.view_sale_list"):
        raise PermissionDenied(_("You are not allowed to view the sales list"))


def can_modify_sale(user, sale: Sale) -> None:
    """
    Validates user permission to modify an existing sale.
    Only OPEN sales can be modified.

    Args:
        user: Django User instance
        sale: Sale instance to modify

    Raises:
        PermissionDenied: If user lacks permission or sale is not OPEN
    """
    _require_authenticated(user)

    # State check first (cheaper than permission check)
    if sale.state != Sale.State.OPEN:
        raise PermissionDenied(_("Only OPEN sales can be modified"))

    if not user.has_perm("sale.modify_sale"):
        raise PermissionDenied(_("You are not allowed to modify sales"))


def can_close_sale(user, sale: Sale) -> None:
    """
    Validates user permission to finalize a sale.
    Sale must be OPEN and contain at least one item.

    Args:
        user: Django User instance
        sale: Sale instance to close

    Raises:
        PermissionDenied: If validation fails
    """
    _require_authenticated(user)

    # Permission check
    if not user.has_perm("sale.close_sale"):
        raise PermissionDenied(_("Missing permission: sale.close_sale"))

    # State validation
    if sale.state != Sale.State.OPEN:
        raise PermissionDenied(_("Only open sales can be closed"))

    # Business rule: Cannot close empty sale
    if not sale.items.exists():
        raise PermissionDenied(_("Cannot close an empty sale"))


def can_cancel_sale(user, sale: Sale) -> None:
    """
    Validates user permission to cancel an existing sale.
    Only OPEN sales can be canceled.

    Args:
        user: Django User instance
        sale: Sale instance to cancel

    Raises:
        PermissionDenied: If validation fails
    """
    _require_authenticated(user)

    # State check
    if sale.state != Sale.State.OPEN:
        raise PermissionDenied(_("Only OPEN sales can be canceled"))

    # Permission check
    if not user.has_perm("sale.cancel_sale"):
        raise PermissionDenied(_("You are not allowed to cancel sales"))
