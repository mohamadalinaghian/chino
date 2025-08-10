from django.db import models


class SupplierQuerySet(models.QuerySet):
    """
    Custom query sets for Supplier.
        - Get supplier visitors numbers.
        - Get related products.
    """

    def with_visitors(self):
        """Get visitor"""
        return self.select_related("company_visitor")

    def with_related_products(self):
        """
        Get all the products that the supplier supply.
        """
        return self.prefetch_related("related_products")

    def with_invoices(self):
        """Get all of it's invoices."""
        return self.prefetch_related("invoices")


class SupplierManager(models.Manager):
    def get_queryset(self):
        return SupplierQuerySet(model=self.model, using=self._db)

    def with_visitors(self):
        return self.get_queryset().with_visitors()

    def with_related_products(self):
        return self.get_queryset().with_related_products()

    def with_invoices(self):
        return self.get_queryset().with_invoices()
