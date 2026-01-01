from decimal import Decimal

from apps.inventory.services.item_production import ItemProductionService
from apps.sale.models import Sale
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from ...policies import can_close_sale


class CloseSaleService:
    """
    Finalizes a sale by:
    1. Generating invoice number
    2. Calculating COGS from inventory
    3. Setting payment status to UNPAID
    4. Transitioning state to CLOSED

    This makes the sale immutable and ready for payment processing.
    """

    @staticmethod
    @transaction.atomic
    def close_sale(
        *,
        sale: Sale,
        performer,
        tax_amount: Decimal = Decimal("0"),
        discount_amount: Decimal = Decimal("0"),
        close_reason: str = "",
    ) -> Sale:
        """
        Finalizes a sale and generates invoice.

        Args:
            sale: Sale instance (must be OPEN)
            performer: User closing the sale
            tax_amount: Optional tax to apply
            discount_amount: Optional discount to apply
            close_reason: Optional reason for closing

        Returns:
            Sale instance with state=CLOSED

        Raises:
            ValidationError: If COGS cannot be calculated or sale is invalid
        """
        # 1. Policy Check
        can_close_sale(performer, sale)

        # 2. Calculate COGS (Cost of Goods Sold)
        total_cost = CloseSaleService._calculate_cogs(sale)

        # 3. Apply financial data
        sale.discount_amount = discount_amount
        sale.tax_amount = tax_amount
        sale.total_cost = total_cost
        # Note: subtotal_amount is already set by OpenSaleService/ModifySaleService
        # Note: total_amount, gross_profit, gross_margin_percent are auto-calculated in save()

        # 4. Set payment status
        sale.payment_status = Sale.PaymentStatus.UNPAID

        # 5. Set state and audit fields
        sale.state = Sale.SaleState.CLOSED
        sale.closed_by = performer
        sale.closed_at = timezone.now()
        sale.close_reason = close_reason

        # 6. Save (will auto-calculate total_amount, gross_profit, etc.)
        sale.save()

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

        for item in items:
            product = item.product

            # Get active recipe for this product
            if not product.is_stock_traceable:
                # Phantom product - must have a recipe
                if not hasattr(product, "active_recipe") or not product.active_recipe:
                    raise ValidationError(
                        _(
                            f"Product '{product.name}' has no active recipe. "
                            "Cannot calculate COGS."
                        )
                    )

                try:
                    # Calculate production cost for this item
                    item_cost = ItemProductionService.get_production_total_cost(
                        recipe=product.active_recipe, used_qt=item.quantity
                    )
                    total_cost += item_cost
                except Exception as e:
                    raise ValidationError(
                        _(
                            f"Failed to calculate COGS for '{
                          product.name}': {str(e)}"
                        )
                    )
            else:
                # Stock-traceable product - get FIFO cost directly
                from apps.inventory.services.stock import StockService

                try:
                    item_cost = StockService.reserve_fifo(product, item.quantity)
                    total_cost += item_cost
                except Exception as e:
                    raise ValidationError(
                        _(
                            f"Failed to reserve stock for '{
                          product.name}': {str(e)}"
                        )
                    )

        return total_cost
