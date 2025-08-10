from decimal import Decimal
from django.db import models
from django.db.models import Sum, F


class PurchaseItemQuerySet(models.QuerySet):
    def with_totals(self):
        """
        Annotate items with calculated_total to allow DB-side aggregation.
        """
        return self.annotate(calculated_total=F("quantity") * F("unit_price"))


class PurchaseItemManager(models.Manager):
    def get_queryset(self):
        return PurchaseItemQuerySet(self.model, using=self._db)

    def with_totals(self):
        return self.get_queryset().with_totals()

    def total_price(self, item):
        return Decimal(item.unit_price or 0) * Decimal(item.quantity or 0)

    def remaining_quantity(self, item):
        returned = item.returns.aggregate(total_returned=Sum("quantity"))[
            "total_returned"
        ] or Decimal("0")
        return Decimal(item.quantity) - Decimal(returned)
