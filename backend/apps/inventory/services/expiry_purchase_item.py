from __future__ import annotations

from datetime import date, timedelta

from django.core.exceptions import ValidationError
from django.db.models import QuerySet
from django.utils.timezone import localdate
from django.utils.translation import gettext_lazy as _

from ..models import ExpiryPurchaseItem, PurchaseItem


class ExpiryPurchaseItemService:
    """Expiry-date handling for purchase items – type-safe."""

    @staticmethod
    def _validate_date(expiry: date) -> None:
        """Expiry must be in the future."""
        if expiry <= localdate():
            raise ValidationError(_("Product is already expired"))

    @staticmethod
    def add_expiry_date(
        purchased_item: PurchaseItem, expiry: date
    ) -> ExpiryPurchaseItem:
        """
        Attach an expiry record to a purchase item.

        The purchased product must be marked ``is_expiry_traceable``.
        """
        if not purchased_item.purchased_product.is_expiry_traceable:
            raise ValidationError(_("This product is not expiry-traceable"))

        ExpiryPurchaseItemService._validate_date(expiry)

        return ExpiryPurchaseItem.objects.create(
            purchased_item=purchased_item, expiry_date=expiry
        )

    @staticmethod
    def expired_in(days: int) -> QuerySet[ExpiryPurchaseItem]:
        """Return items that expire within the next *days*."""
        today = date.today()
        end = today + timedelta(days=days)
        return ExpiryPurchaseItem.objects.filter(expiry_date__range=(today, end))

    @staticmethod
    def delete_expired_product() -> int:
        """Remove all expired records. Returns number of deletions."""
        return ExpiryPurchaseItem.objects.filter(
            expiry_date__lte=date.today()
        ).delete()[0]
