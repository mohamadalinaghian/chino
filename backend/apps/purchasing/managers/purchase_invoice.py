from django.utils import timezone
from django.db import models
from decimal import Decimal
from django.db.models import Sum


class PurchaseInvoiceQuerySet(models.QuerySet):
    """
    Custom querysets:
        - Invoices between two specified dates.
        - Invoice items.
        - Total cost.
        - Retrieved supplier.
    """

    def get_items(self):
        """
        Get all the invoice items.
        """
        return self.prefetch_related("items")

    def invoices_between(self, start_date, end_date=None):
        """
        Get all the invoices in two dates.
        """
        if end_date is None:
            end_date = timezone.now()
        return self.filter(issue_date__range=[start_date, end_date])

    def total_cost(self):
        """
        Get total cost of all invoices between two dates.
        """
        return self.aggregate(
            total=Sum("invoice_final_cost", output_field=models.DecimalField())
        )["total"] or Decimal("0.00")

    def by_supplier(self, supplier):
        """
        Get the supplier name.
        """
        return self.filter(supplier_name=supplier)


class PurchaseInvoiceManager(models.Manager):
    def get_queryset(self):
        return PurchaseInvoiceQuerySet(self.model, using=self._db)

    def get_items(self):
        return self.get_queryset().get_items()

    def invoices_between(self, start_date, end_date=None):
        return self.get_queryset().invoices_between(start_date, end_date)

    def total_cost(self):
        return self.get_queryset().total_cost()

    def by_supplier(self, supplier):
        return self.get_queryset().by_supplier(supplier)
