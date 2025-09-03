from datetime import date, timedelta

import pytest
from apps.inventory.models import ExpiryPurchaseItem
from apps.inventory.services.expiry_purchase_item import ExpiryPurchaseItemService
from apps.inventory.tests.factories import (
    ExpiryPurchaseItemFactory,
    PurchaseItemFactory,
)
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestExpiryPurchaseItemService:
    def test_date_validation_future_ok(self):
        future = date.today() + timedelta(days=5)
        ExpiryPurchaseItemService.date_validation(future)  # no exception

    def test_date_validation_today_or_past_invalid(self):
        with pytest.raises(ValidationError):
            ExpiryPurchaseItemService.date_validation(date.today())
        with pytest.raises(ValidationError):
            ExpiryPurchaseItemService.date_validation(date.today() - timedelta(days=1))

    def test_add_expiry_date_success_for_traceable_product(self):
        purchase_item = PurchaseItemFactory(purchased_product__is_expiry_traceable=True)
        expiry_date = date.today() + timedelta(days=5)
        obj = ExpiryPurchaseItemService.add_expiry_date(purchase_item, expiry_date)
        assert obj.expiry_date == expiry_date
        assert obj.purchased_item == purchase_item

    def test_add_expiry_date_fail_for_non_traceable_product(self):
        purchase_item = PurchaseItemFactory(
            purchased_product__is_expiry_traceable=False
        )
        expiry_date = date.today() + timedelta(days=5)
        with pytest.raises(ValidationError):
            ExpiryPurchaseItemService.add_expiry_date(purchase_item, expiry_date)

    def test_expired_in_returns_only_matching(self):
        target = ExpiryPurchaseItemFactory(expiry_date=date.today() + timedelta(days=2))
        ExpiryPurchaseItemFactory(expiry_date=date.today() + timedelta(days=20))
        qs = ExpiryPurchaseItemService.expired_in(5)
        assert target in qs
        assert all(obj.expiry_date <= date.today() + timedelta(days=5) for obj in qs)

    def test_delete_expired_product(self):
        expired = ExpiryPurchaseItemFactory(
            expiry_date=date.today() - timedelta(days=1)
        )
        ExpiryPurchaseItemService.delete_expired_product()
        assert not ExpiryPurchaseItem.objects.filter(pk=expired.pk).exists()
