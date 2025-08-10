from django.db import models


class SupplierVisitorQuerySet(models.QuerySet):
    """
    Custom supplier's visitor query sets.
        - Get visitor relative supplier.
    """

    def with_supplier(self):
        """Retrieve supplier name."""
        return self.prefetch_related("company")


class SupplierVisitorManager(models.Manager):
    def get_queryset(self):
        return SupplierVisitorQuerySet(self.model, using=self._db)

    def with_supplier(self):
        return self.get_queryset().with_supplier()
