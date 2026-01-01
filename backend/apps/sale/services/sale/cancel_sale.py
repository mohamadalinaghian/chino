from apps.sale.models import Sale
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from ...policies import can_cancel_close_sale, can_cancel_open_sale


class CancelSaleService:
    """
    Cancels/voids an open sale.

    Rules:
        - Only OPEN sales can be canceled
        - Cancellation reason is required
        - Once canceled, sale cannot be modified or closed

    For CLOSED sales with payments, use refund services instead.
    """

    @staticmethod
    @transaction.atomic
    def cancel_open_sale(*, sale: Sale, performer, cancel_reason: str) -> Sale:
        """
        Cancel an OPEN sale.

        Args:
            sale: Sale instance (must be OPEN)
            performer: User canceling the sale
            cancel_reason: Required reason for cancellation

        Returns:
            Sale instance with state=CANCELED

        Raises:
            PermissionDenied: If user lacks permission or sale is not OPEN
            ValidationError: If cancel_reason is empty
        """
        # 1. Validate reason
        if not cancel_reason or not cancel_reason.strip():
            raise ValidationError(_("Cancellation reason is required"))

        # 2. Policy Check (checks state and permission)
        can_cancel_open_sale(performer, sale)

        # 3. Set cancellation data
        sale.state = Sale.SaleState.CANCELED
        sale.canceled_by = performer
        sale.canceled_at = timezone.now()
        sale.cancel_reason = cancel_reason.strip()

        # 4. Save
        sale.save()

        return sale

    @staticmethod
    @transaction.atomic
    def cancel_close_sale(*, sale: Sale, performer, cancel_reason: str) -> Sale:
        """
        Cancel a CLOSED sale.

        Args:
            sale: Sale instance
            performer: User canceling the sale
            cancel_reason: Required reason for cancellation

        Returns:
            Sale instance with state=CANCELED

        Raises:
            PermissionDenied: If user lacks permission or sale is CLOSED
            ValidationError: If cancel_reason is empty
        """
        # 1. Validate reason
        if not cancel_reason or not cancel_reason.strip():
            raise ValidationError(_("Cancellation reason is required"))

        # 2. Policy Check (checks state and permission)
        can_cancel_close_sale(performer, sale)

        # 3. Set cancellation data
        sale.state = Sale.SaleState.CANCELED
        sale.canceled_by = performer
        sale.canceled_at = timezone.now()
        sale.cancel_reason = cancel_reason.strip()

        # 4. Save
        sale.save()

        return sale
