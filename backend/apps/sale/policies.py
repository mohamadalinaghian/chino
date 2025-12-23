from django.core.exceptions import PermissionDenied
from django.utils.translation import gettext_lazy as _

from .models import Sale


def _require_authenticated(user):
    if not user or not user.is_authenticated:
        raise PermissionDenied(_("Authentication required"))


def can_open_sale(user):
    """
    User is allowed to create an OPEN sale.
    """
    _require_authenticated(user)

    if not user.has_perm("sale.open_sale"):
        raise PermissionDenied(_("You are not allowed to open a sale"))


def can_see_sale_details(user):
    _require_authenticated(user)

    if not user.has_perm("sale.can_see_sale_items"):
        raise PermissionDenied(_("You are not allowed to see this sale items"))


def can_see_sale_list(user):
    _require_authenticated(user)

    if not user.has_perm("sale.can_see_sale_list"):
        raise PermissionDenied(_("You are not allowed to see this sale items"))


def can_modify_sale(user, sale: Sale):
    """
    User is allowed to modify an existing OPEN sale.
    """
    _require_authenticated(user)

    if sale.state != Sale.State.OPEN:
        raise PermissionDenied(_("Only OPEN sales can be modified"))

    if not user.has_perm("sale.modify_sale"):
        raise PermissionDenied(_("You are not allowed to modify sales"))


def can_close_sale(user, sale: Sale):
    """
    User is allowed to close an OPEN sale.
    """
    _require_authenticated(user)

    # Permissions
    if not user.has_perm("sale.close_sale"):
        raise PermissionDenied(_("Missing permission: sale.close_sale"))

    # State Logic
    if sale.state != Sale.State.OPEN:
        raise PermissionDenied(_("Only open sales can be closed"))
    if not sale.items.exists():
        raise PermissionDenied(_("Cannot close an empty sale"))


def can_cancel_sale(user, sale: Sale):
    """
    User is allowed to cancel an OPEN sale.
    """
    _require_authenticated(user)

    if sale.state != Sale.State.OPEN:
        raise PermissionDenied(_("Only OPEN sales can be canceled"))

    if not user.has_perm("sale.cancel_sale"):
        raise PermissionDenied(_("You are not allowed to cancel sales"))
