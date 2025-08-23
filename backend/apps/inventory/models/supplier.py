from django.db import models
from django.utils.translation import gettext_lazy as _


class Supplier(models.Model):
    """
    Metadata about products supplier.
    """

    company_name = models.CharField(_("Company Name"), max_length=50, unique=True)
    info = models.CharField(_("Information"), max_length=200, null=True, blank=True)
    related_products = models.ForeignKey("inventory.")
