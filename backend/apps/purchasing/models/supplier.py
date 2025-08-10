from django.db import models
from django.utils.translation import gettext_lazy as _
from ..managers import SupplierManager


class Supplier(models.Model):
    """
    Represents a supplier entity for purchase transactions.
    """

    name = models.CharField(_("Supplier Name"), max_length=64, unique=True)
    related_products = models.ManyToManyField(
        "inventory.Product", verbose_name=_("Related Products")
    )

    company_visitor = models.ManyToManyField(
        verbose_name=_("Company Visitor"),
        to="purchasing.SupplierVisitor",
        related_name="company",
    )
    is_active = models.BooleanField(_("Active"), default=True)
    address = models.CharField(_("Address"), max_length=250, null=True, blank=True)
    note = models.CharField(_("Note"), blank=True, max_length=255)

    objects = SupplierManager()

    class Meta:
        verbose_name = _("Supplier")
        verbose_name_plural = _("Suppliers")
        ordering = ["name"]

    def __str__(self):
        return self.name
