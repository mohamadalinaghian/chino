"""
Service responsible for closing a sale.
After this point, the sale becomes immutable.
"""

from decimal import Decimal

from apps.sale.models import Sale
from apps.sale.policies import can_close_sale
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _


class CloseSaleService:
    """
    Finalizes an OPEN sale and locks all monetary values.

    Invariants enforced:
        - subtotal_amount >= subtotal_paid
        - subtotal_paid + discount == total_amount
    """

    @staticmethod
    @transaction.atomic
    def close(*, sale: Sale, performer) -> Sale:
        # --------------------------------------------------
        # 1. Policy & state validation
        # --------------------------------------------------
        can_close_sale(performer, sale)

        if sale.state != Sale.SaleState.OPEN:
            raise ValidationError(_("Only OPEN sales can be closed"))

        # --------------------------------------------------
        # 2. Financial integrity checks
        # --------------------------------------------------
        if sale.subtotal_amount < sale.subtotal_paid:
            raise ValidationError(
                _("Sale subtotal (%(subtotal)s) is lower than paid amount (%(paid)s)")
                % {
                    "subtotal": sale.subtotal_amount,
                    "paid": sale.subtotal_paid,
                }
            )

        expected_total = sale.subtotal_paid + sale.discount_amount
        if sale.total_amount != expected_total:
            raise ValidationError(
                _(
                    "Invalid final total. "
                    "Expected total (%(expected)s) != stored total (%(actual)s)"
                )
                % {
                    "expected": expected_total,
                    "actual": sale.total_amount,
                }
            )
        # --------------------------------------------------
        # 3. Cunsome stock for sale.
        # --------------------------------------------------
        CloseSaleService._calculate_cogs(sale)

        # --------------------------------------------------
        # 4. Lock the sale
        # --------------------------------------------------
        sale.state = Sale.SaleState.CLOSED
        sale.closed_by = performer
        sale.closed_at = sale.closed_at or sale.updated_at

        sale.save(
            update_fields=[
                "state",
                "closed_by",
                "closed_at",
            ]
        )

        return sale

    @staticmethod
    def _calculate_cogs(sale: Sale) -> Decimal:
        """
        Calculate total Cost of Goods Sold for all items in the sale.

        Uses inventory system to get FIFO costs for each product's recipe.

        Args:
            sale: Sale instance with items

        Returns:
            Total COGS as Decimal

        Raises:
            ValidationError: If any product lacks a recipe or calculation fails
        """
        total_cost = Decimal("0")

        # Get all top-level items (parent_item is None)
        items = sale.items.filter(parent_item__isnull=True).select_related("product")

        from ....inventory.services import ItemProductionService

        for item in items:
            product = item.product

            try:
                # Calculate production cost for this item and consume from product
                # TODO: cosume from stock is dublicated here and payment service.
                item_cost = ItemProductionService.get_production_total_cost(
                    recipe=product.active_recipe, used_qt=item.quantity
                )
                total_cost += item_cost
            except Exception as e:
                raise ValidationError(
                    _(f"Failed to calculate COGS for '{product.name}': {str(e)}")
                )

        return total_cost
