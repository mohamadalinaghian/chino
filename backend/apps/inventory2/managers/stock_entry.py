from django.db import models


class StockEntryQuerySet(models.QuerySet):
    def get_remained(self):
        """
        Returns only non-depleted stock entries.
        """
        return self.filter(is_depleted=False)

    def get_product(self, product):
        """Returns product related records."""
        return self.filter(product=product)

    def first_in(self, product):
        """
        Returns the earliest available stock entry for FIFO consumption.
        Order is deterministic: created_at ASC.
        """
        return (
            self.get_remained()
            .get_product(product)
            .order_by("created_at")
            .select_for_update(skip_locked=True)
        )


class StockEntryManager(models.Manager):
    def get_queryset(self):
        return StockEntryQuerySet(self.model, using=self._db)

    def first_in(self, product):
        """
        Shortcut to get the first-in stock entry.
        """
        return self.get_queryset().first_in(product=product)
