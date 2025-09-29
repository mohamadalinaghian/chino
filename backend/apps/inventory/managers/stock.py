from django.db import models


class StockQuerySet(models.QuerySet):

    def get_product(self, product):
        """Returns product related records."""
        return self.filter(stored_product=product)

    def first_in(self, product):
        """
        Returns the earliest available stock for FIFO consumption.
        Order is deterministic: created_at ASC.
        """
        return (
            self.get_product(product)
            .order_by("create_at")
            .select_for_update(skip_locked=True)
        )


class StockManager(models.Manager):
    def get_queryset(self):
        return StockQuerySet(self.model, using=self._db)

    def first_in(self, product):
        """
        Shortcut to get the first-in stock entry.
        """
        return self.get_queryset().first_in(product=product)
