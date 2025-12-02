from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _


class CashTransaction(models.Model):
    """
    Cash-specific transaction details.
    """

    transaction = models.OneToOneField(
        "sale.Transaction",
        on_delete=models.CASCADE,
        related_name="cash_details",
        primary_key=True,
    )
    cash_register_id = models.CharField(
        _("Cash register ID"),
        max_length=20,
        blank=True,
        default="",
    )

    class Meta:
        verbose_name = _("Cash Transaction")
        verbose_name_plural = _("Cash Transactions")

    def __str__(self) -> str:
        return f"Cash: {self.transaction}"
