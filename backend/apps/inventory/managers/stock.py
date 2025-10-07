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

    def get_total(self, product):
        """Returns all amount of product"""
        return (
            self.filter(stored_product=product).aggregate(
                total_qt=models.Sum("remaining_quantity")
            )["total_qt"]
            or 0
        )

    def max_price(self, product):
        return (
            self.filter(stored_product=product).aggregate(max=models.Max("unit_price"))[
                "max"
            ]
            or 0
        )


class StockManager(models.Manager):
    def get_queryset(self):
        return StockQuerySet(self.model, using=self._db)

    def first_in(self, product):
        """
        Shortcut to get the first-in stock entry.
        """
        return self.get_queryset().first_in(product=product)

    def get_total(self, product):
        return self.get_queryset().get_total(product)

    def max_price(self, product):
        return self.get_queryset().max_price(product)
