from rest_framework.permissions import BasePermission


class HasSalePermission(BasePermission):
    """
    Check if user has required sale permission.

    Usage in view:
        permission_classes = [HasSalePermission]
        permission_required = 'sale.view_sale_items'
    """

    def has_permission(self, request, view):
        # User must be authenticated (set by middleware)
        if not request.user or not request.user.is_authenticated:
            return False

        # User must be staff
        if not request.user.is_staff:
            return False

        # Get required permission from view
        permission_required = getattr(view, "permission_required", None)

        if not permission_required:
            # View didn't specify permission - allow by default
            return True

        # Check if user has permission
        return request.user.has_perm(permission_required)

    def get_message(self):
        return "You don't have permission to perform this action."


class CanViewSaleItems(BasePermission):
    """Specific permission: Can view sale items."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        return request.user.has_perm("sale.view_sale_items")


class CanCreateInvoice(BasePermission):
    """Specific permission: Can create invoice."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        return request.user.has_perm("sale.create_invoice")
