from django.utils import timezone
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.utils.models import TimeStampedModel


class PurchaseReturn(TimeStampedModel):
    """
    Represents a return of previously purchased item(s).
    """

    purchase_item = models.ForeignKey(
        "purchasing.PurchaseItem",
        on_delete=models.CASCADE,
        related_name="returns",
        verbose_name=_("Original Purchase Item"),
    )

    quantity = models.DecimalField(
        _("Returned Quantity"),
        max_digits=10,
        decimal_places=2,
        help_text=_("Amount of the item being returned"),
    )

    reason = models.CharField(
        _("Reason for Return"),
        max_length=255,
        blank=True,
        help_text=_("Optional reason for returning the item"),
    )

    return_date = models.DateField(_("Return Date"), default=timezone.now)

    class Meta:
        verbose_name = _("Purchase Return")
        verbose_name_plural = _("Purchase Returns")
        ordering = ["-created"]

    def __str__(self):
        return f"{self.quantity} " + _("returned from") + f" {self.purchase_item}"
