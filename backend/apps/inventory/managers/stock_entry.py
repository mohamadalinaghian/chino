from django.db import models


class StockEntryQuerySet(models.QuerySet):
    def get_remained(self):
        """
        Returns only non-depleted stock entries.
        """
        return self.filter(is_depleted=False)

    def first_in(self):
        """
        Returns the earliest available stock entry for FIFO consumption.
        Order is deterministic: created_at ASC, then PK ASC.
        """
        return (
            self.get_remained()
            .order_by("created_at", "pk")
            .select_related("product")  # if you always need product
            .first()
        )


class StockEntryManager(models.Manager):
    def get_queryset(self):
        return StockEntryQuerySet(self.model, using=self._db)

    def first_in(self):
        """
        Shortcut to get the first-in stock entry.
        """
        return self.get_queryset().first_in()
