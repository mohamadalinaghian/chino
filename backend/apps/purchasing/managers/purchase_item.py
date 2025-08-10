from decimal import Decimal
from django.db import models
from django.db.models import Sum, F


class PurchaseItemQuerySet(models.QuerySet):
    def with_totals(self):
        """
        Annotate items with calculated_total.
        """
        return self.annotate(calculated_total=F("quantity") * F("unit_price"))

    def total_cost(self):
        """Return total cost of all items (quantity * unit_price)."""
        return self.aggregate(
            total=Sum(
                F("quantity") * F("unit_price"), output_field=models.DecimalField()
            )
        )["total"] or Decimal("0.00")


class PurchaseItemManager(models.Manager):
    def get_queryset(self):
        return PurchaseItemQuerySet(self.model, using=self._db)

    def with_totals(self):
        return self.get_queryset().with_totals()
