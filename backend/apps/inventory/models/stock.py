from django.db import models
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _

from ..managers import StockManager


class Stock(models.Model):
    """
    It's middleware model to store products that have remaining quantity.
    Record will be deleted if remaining quantity raise to Zero so search would be easier.
    **This model is not for reports only used for daily calculations**.
    """

    # Fields
    stored_product = models.ForeignKey(
        "inventory.Product",
        models.CASCADE,
        verbose_name=_("Stored porduct"),
        related_name="stocks",
    )
    initial_quantity = models.DecimalField(
        verbose_name=_("Initial quantity"), max_digits=10, decimal_places=2
    )
    remaining_quantity = models.DecimalField(
        verbose_name=_("Remaining quantity"), max_digits=10, decimal_places=2
    )
    unit_price = models.DecimalField(
        verbose_name=_("Unit price"), max_digits=10, decimal_places=2
    )
    create_at = models.DateField(
        verbose_name=_("Created at"),
        default=now,
    )

    objects = StockManager()

    # Methods
    def __str__(self) -> str:
        return f"{self.stored_product}: {self.create_at}"

    # Meta
    class Meta:
        verbose_name = _("Stock")
        verbose_name_plural = verbose_name
        ordering = ("create_at",)
        indexes = (
            models.Index(
                name="idx_stored_product_create", fields=("stored_product", "create_at")
            ),
        )
