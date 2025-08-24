from django.db import models
from django.utils.translation import gettext_lazy as _

from ..managers import SupplierManager


class Supplier(models.Model):
    """
    Represents a supplier company that provides one or more products.
    """

    company_name = models.CharField(_("Company Name"), max_length=50, unique=True)
    info = models.CharField(_("Information"), max_length=200, null=True, blank=True)
    products = models.ManyToManyField(
        "inventory.Product",
        through="inventory.SupplierProduct",
        related_name="suppliers",
        verbose_name=_("Supplied Products"),
    )

    objects = SupplierManager()

    class Meta:
        verbose_name = _("Supplier")
        verbose_name_plural = _("Suppliers")

    def __str__(self):
        return str(self.company_name)
