from django.db import models


class SupplierQuerySet(models.QuerySet):
    def with_visitors(self):
        return self.prefetch_related("visitors")


class SupplierManager(models.Manager):
    def get_queryset(self):
        return SupplierQuerySet(model=self.model, using=self._db)

    def with_visitors(self):
        return self.get_queryset().with_visitors()
