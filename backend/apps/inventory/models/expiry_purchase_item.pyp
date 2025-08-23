from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class ExpiryPurchaseItem(models.Model):
    """
    This model store exipry date of product purchase.
    """

    # Fields
    purchased_item = models.ForeignKey(
        "inventory.PurchaseItem",
        models.CASCADE,
        related_name="expiration date",
        verbose_name=_("Purchased Item"),
    )
    expiry_date = models.DateField(_("Expiry Date"), default=timezone.now)

    # Meta
    class Meta:
        verbose_name = _("Expiry Purchase Item")
        verbose_name_plural = _("Expiry Purchase Items")
        ordering = ("-expiry_date",)

    # Methods
    def __str__(self):
        return f"{self.purchased_item.name} {self.expiry_date}"
