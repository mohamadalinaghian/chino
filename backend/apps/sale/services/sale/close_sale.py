import re
from decimal import Decimal
from typing import List

from apps.inventory.services.item_production import ItemProductionService
from apps.sale.models import Sale, SalePayment
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Max
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from ...policies import can_close_sale
from ..payment.payment_service import PaymentInput, PaymentService


def generate_invoice_number() -> str:
    """
    Generate unique invoice number.

    Format: INV-YYYYMMDD-XXXXX
    Where XXXXX is a zero-padded sequential number for the day.

    Returns:
        Unique invoice number string
    """
    # Get today's date prefix
    date_prefix = timezone.now().strftime("INV-%Y%m%d-")

    # Find highest number for today
    latest = Sale.objects.filter(invoice_number__startswith=date_prefix).aggregate(
        Max("invoice_number")
    )["invoice_number__max"]

    if latest:
        # Extract the numeric part and increment
        match = re.search(r"-(\d+)$", latest)
        if match:
            next_num = int(match.group(1)) + 1
        else:
            next_num = 1
    else:
        next_num = 1

    # Format with zero-padding (5 digits)
    return f"{date_prefix}{next_num:05d}"


class CloseSaleService:
    """
    Finalizes a sale and processes payments in one atomic operation.

    Workflow:
        1. Generate invoice number
        2. Calculate COGS from inventory
        3. Apply tax and discount
        4. Set state to CLOSED
        5. Process payments
        6. Update payment status (PAID/PARTIALLY_PAID/UNPAID)

    Business Rules:
        - Sale can be closed with full, partial, or no payment
        - All critical financial data calculated on backend
        - Payment status automatically updated based on total paid
    """

    @staticmethod
    @transaction.atomic
    def finalize_and_pay(
        *,
        sale: Sale,
        performer,
        tax_amount: Decimal = Decimal("0"),
        discount_amount: Decimal = Decimal("0"),
        payments: List[PaymentInput],
    ) -> tuple[Sale, List[SalePayment]]:
        """
        Finalize sale and process payments in one atomic transaction.

        Args:
            sale: Sale instance (must be OPEN)
            performer: User finalizing the sale
            tax_amount: Tax to apply
            discount_amount: Discount to apply
            payments: List of payment inputs

        Returns:
            Tuple of (Sale instance, List of SalePayment instances)

        Raises:
            ValidationError: If sale is invalid or payments fail validation
        """
        # 1. Policy Check
        can_close_sale(performer, sale)

        # 3. Calculate COGS (Cost of Goods Sold)
        total_cost = CloseSaleService._calculate_cogs(sale)

        # 4. Apply financial data
        sale.discount_amount = discount_amount
        sale.tax_amount = tax_amount
        sale.total_cost = total_cost
        # Note: subtotal_amount already set by OpenSaleService/ModifySaleService
        # Note: total_amount, gross_profit, gross_margin_percent auto-calculated in save()

        # 5. Set state and audit fields
        sale.state = Sale.SaleState.CLOSED
        sale.closed_by = performer
        sale.closed_at = timezone.now()

        # Initial payment status (will be updated after processing payments)
        sale.payment_status = Sale.PaymentStatus.UNPAID

        # 6. Save sale with calculated fields
        sale.save()

        # 7. Process payments if provided
        created_payments = []
        if payments:
            created_payments = PaymentService.process_payments(
                sale=sale, payments=payments, performer=performer
            )

        return sale, created_payments

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

            try:
                # Calculate production cost for this item and consume from product
                # TODO: cosume from stock is dublicated here and payment service.
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

        return total_cost
