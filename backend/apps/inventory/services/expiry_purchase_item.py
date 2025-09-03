from datetime import datetime, timedelta

from django.core.exceptions import ValidationError
from django.utils.timezone import localdate
from django.utils.translation import gettext_lazy as _

from ..models import ExpiryPurchaseItem


class ExpiryPurchaseItemService:
    """
    Validate and add expiry traceable product.

    Delete products with passed expiry date.

    show products with N days left to expiry.
    """

    @staticmethod
    def date_validation(date):
        if date <= localdate():
            raise ValidationError(_("This is not a valid purchase, product is expired"))

    @staticmethod
    def add_expiry_date(purchased_item, date):

        # Validate product
        _expiry_traceable = purchased_item.purchased_product.is_expiry_traceable
        if not _expiry_traceable:
            raise ValidationError(_("This product is not expiry traceable"))

        # Validate date
        ExpiryPurchaseItemService.date_validation(date)

        # Add record
        obj = ExpiryPurchaseItem.objects.create(
            purchased_item=purchased_item, expiry_date=date
        )
        return obj

    @staticmethod
    def expired_in(days: int):
        today = datetime.now().date()
        end_date = today + timedelta(days=days)
        prod_qs = ExpiryPurchaseItem.objects.filter(
            expiry_date__range=(today, end_date)
        )
        return prod_qs

    @staticmethod
    def delete_expired_product():
        """Delete the record."""
        ExpiryPurchaseItem.objects.filter(
            expiry_date__lte=datetime.now().date()
        ).delete()
